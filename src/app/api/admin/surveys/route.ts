import { createServerLevelClient } from "@/lib/supabase/server";
import { TablesInsert } from "@/database/database.types";
import { postgrestErrorToHttpStatus } from "@/database/utils";
import { parseSurveyFields } from "@/lib/surveyFields";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type SurveyInsert = Pick<
  TablesInsert<"surveys">,
  "tree" | "issue" | "issue_other" | "image_link" | "admin_contact" | "notes"
>;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * GET — list surveys. RLS scopes the result: admins see everything, Tree
 * Keepers see surveys related to their tasks/trees plus their own submissions.
 */
export async function GET() {
  try {
    const supabase = await createServerLevelClient();
    const { data, error } = await supabase.from("surveys").select("*").order("created_at", { ascending: true });
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
 * POST — create a survey from the Surveys dashboard (optional `tree`, no task).
 *
 * RLS decides who can write: admins may create any survey (linked to any tree
 * or to none); Tree Keepers may only create surveys linked to one of their own
 * trees. `submitted_by` is stamped by the column default and is not accepted
 * from the client. Task-linked surveys are created through the Tasks flow
 * (`POST /api/public/surveys`), never here.
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

    if (json.task != null) {
      return NextResponse.json({ message: "Task-linked surveys are created from the Tasks page." }, { status: 400 });
    }

    const tree = json.tree;
    if (tree != null && (typeof tree !== "number" || !Number.isInteger(tree))) {
      return NextResponse.json({ message: "tree must be a number (trees.ecoslo_num) or null" }, { status: 400 });
    }
    const treeNum: number | null = typeof tree === "number" ? tree : null;

    const parsed = parseSurveyFields(json);
    if (parsed.error) {
      return NextResponse.json({ message: parsed.error }, { status: 400 });
    }

    // RLS scopes this lookup, so a Tree Keeper linking someone else's tree
    // gets the same "not found" as a nonexistent number.
    if (treeNum != null) {
      const { data: treeRow, error: treeError } = await supabase
        .from("trees")
        .select("ecoslo_num")
        .eq("ecoslo_num", treeNum)
        .maybeSingle();

      if (treeError) {
        return NextResponse.json({ message: treeError.message }, { status: postgrestErrorToHttpStatus(treeError) });
      }
      if (!treeRow) {
        return NextResponse.json({ message: "That tree could not be found." }, { status: 400 });
      }
    }

    const insert: SurveyInsert = { tree: treeNum, ...parsed.fields };

    const { data, error } = await supabase.from("surveys").insert(insert).select("id, tree").single();

    if (error) {
      if (error.code === "42501") {
        return NextResponse.json(
          { message: "Tree Keepers must link a survey to one of their own trees." },
          { status: 403 },
        );
      }
      return NextResponse.json({ message: error.message }, { status: postgrestErrorToHttpStatus(error) });
    }

    return NextResponse.json({ data: data }, { status: 201 });
  } catch {
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
