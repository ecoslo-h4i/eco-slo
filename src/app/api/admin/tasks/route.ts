import { createServerLevelClient } from "@/lib/supabase/server";
import { Enums, TablesInsert } from "@/database/database.types";
import { postgrestErrorToHttpStatus } from "@/database/utils";
import { NextRequest, NextResponse } from "next/server";

type SurveyMode = Enums<"TaskSurveyMode">;
type TaskInsert = TablesInsert<"tasks">;

const SURVEY_MODES = ["none", "optional", "required"] as const satisfies readonly SurveyMode[];
const MAX_REQUIRED_SURVEYS_WITHOUT_TREES = 10;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseNumberArray(value: unknown, fieldName: string): { value?: number[]; error?: string } {
  if (value == null) return { value: [] };
  if (!Array.isArray(value)) return { error: `${fieldName} must be an array.` };

  const parsed = value.map((item) => Number(item));
  if (parsed.some((item) => !Number.isInteger(item) || item <= 0)) {
    return { error: `${fieldName} must contain positive integer IDs.` };
  }

  return { value: Array.from(new Set(parsed)).sort((a, b) => a - b) };
}

function parseSurveyMode(value: unknown): SurveyMode | null {
  return typeof value === "string" && (SURVEY_MODES as readonly string[]).includes(value)
    ? (value as SurveyMode)
    : null;
}

function parseRequiredCount(value: unknown): number | null {
  if (value == null || value === "") return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : null;
}

/**
 * GET API ROUTE: Retrieves all tasks from the database
 *
 * Fetches all rows and columns from the tasks table, sorted by creation date ascending.
 *
 * Parameters: none
 *
 * Returns:
 * - 200 with { data: Notification[] } on success
 * - Supabase error with mapped status code { data: null, error: string }
 * - 500 on server error { data: null, error: "Internal Server Error" }
 */
export async function GET() {
  try {
    const supabase = await createServerLevelClient();
    const { data, error } = await supabase.from("tasks").select("*").order("created_at", { ascending: true });
    if (error) {
      const status = postgrestErrorToHttpStatus(error);
      return NextResponse.json({ message: error.message }, { status: status });
    }
    if (data === null || data.length == 0) {
      return NextResponse.json({ error: "No data found" }, { status: 404 });
    }
    return NextResponse.json({ message: data }, { status: 200 });
  } catch {
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

/**
 * POST API ROUTE: Creates a new notification
 *
 * Inserts a new row into the tasks table using the JSON body from the request.
 *
 * Parameters:
 * @param request - JSON body containing fields to insert, matching {@link TablesInsert<"notifications">}
 *
 * Returns:
 * - 200 with { data: Notification } on success
 * - Supabase error with mapped status code { data: null, error: string }
 * - 500 on server error { data: null, error: "Internal Server Error" }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerLevelClient();
    let json: unknown;
    try {
      json = await request.json();
    } catch {
      return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 });
    }

    if (!isPlainObject(json)) {
      return NextResponse.json({ message: "Body must be a JSON object" }, { status: 400 });
    }

    const title = typeof json.title === "string" ? json.title.trim() : "";
    if (!title) {
      return NextResponse.json({ message: "Title is required." }, { status: 400 });
    }

    const message = typeof json.message === "string" ? json.message.trim() : "";

    const assigneesResult = parseNumberArray(json.assignees, "assignees");
    if (assigneesResult.error) {
      return NextResponse.json({ message: assigneesResult.error }, { status: 400 });
    }
    const assignees = assigneesResult.value ?? [];

    const treeTargetsResult = parseNumberArray(json.tree_targets, "tree_targets");
    if (treeTargetsResult.error) {
      return NextResponse.json({ message: treeTargetsResult.error }, { status: 400 });
    }
    const treeTargets = treeTargetsResult.value ?? [];

    const surveyMode = parseSurveyMode(json.survey_mode);
    if (!surveyMode) {
      return NextResponse.json({ message: "survey_mode must be none, optional, or required." }, { status: 400 });
    }

    if (treeTargets.length > 0) {
      if (assignees.length === 0) {
        return NextResponse.json({ message: "Linked trees require at least one assignee." }, { status: 400 });
      }

      // Admins may link any tree, not just the assignees' own. RLS scopes this
      // lookup, so a non-admin caller still can only link trees they can see.
      const { data: trees, error: treesError } = await supabase
        .from("trees")
        .select("ecoslo_num")
        .in("ecoslo_num", treeTargets);

      if (treesError) {
        return NextResponse.json({ message: treesError.message }, { status: postgrestErrorToHttpStatus(treesError) });
      }

      const validTargets = new Set(
        (trees ?? []).map((tree) => tree.ecoslo_num).filter((num): num is number => typeof num === "number"),
      );

      const invalidTargets = treeTargets.filter((tree) => !validTargets.has(tree));
      if (invalidTargets.length > 0) {
        return NextResponse.json({ message: "One or more linked trees could not be found." }, { status: 400 });
      }
    }

    let surveyRequiredCount = 0;
    let surveysNeeded = 0;
    if (surveyMode === "required") {
      const requestedCount = parseRequiredCount(json.survey_required_count);
      surveyRequiredCount = requestedCount ?? (treeTargets.length > 0 ? treeTargets.length : 1);

      if (treeTargets.length > 0) {
        if (surveyRequiredCount < 1 || surveyRequiredCount > treeTargets.length) {
          return NextResponse.json(
            { message: "Required survey count must be between 1 and the number of linked trees." },
            { status: 400 },
          );
        }
      } else if (surveyRequiredCount < 1 || surveyRequiredCount > MAX_REQUIRED_SURVEYS_WITHOUT_TREES) {
        return NextResponse.json(
          { message: `Required survey count must be between 1 and ${MAX_REQUIRED_SURVEYS_WITHOUT_TREES}.` },
          { status: 400 },
        );
      }

      surveysNeeded = surveyRequiredCount;
    }

    const { data: currentMemberId } = await supabase.rpc("current_member_id");
    const body: TaskInsert = {
      title,
      message,
      assignees,
      is_complete: false,
      completion_date: null,
      surveys_needed: surveysNeeded,
      survey_mode: surveyMode,
      survey_required_count: surveyRequiredCount,
      tree_targets: treeTargets.length > 0 ? treeTargets : null,
      type: "Other",
      created_by: typeof currentMemberId === "number" ? currentMemberId : null,
    };

    const { data, error } = await supabase.from("tasks").insert(body).select();

    if (error) {
      const status = postgrestErrorToHttpStatus(error);
      return NextResponse.json({ error: error }, { status: status });
    }

    return NextResponse.json({ data: data }, { status: 200 });
  } catch {
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
