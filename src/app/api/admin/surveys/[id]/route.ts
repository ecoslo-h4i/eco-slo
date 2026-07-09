import { createServerLevelClient } from "@/lib/supabase/server";
import { TablesUpdate } from "@/database/database.types";
import { hasOnlyAllowedKeys, postgrestErrorToHttpStatus } from "@/database/utils";
import { parseSurveyFields } from "@/lib/surveyFields";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type SurveyUpdate = Pick<
  TablesUpdate<"surveys">,
  "tree" | "issue" | "issue_other" | "image_link" | "admin_contact" | "notes"
>;

const SURVEY_UPDATE_KEYS = ["issue", "issue_other", "image_link", "admin_contact", "notes", "tree"] as const;

type IParams = {
  params: Promise<{
    id: string;
  }>;
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseSurveyId(raw: string): number | null {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function GET(req: NextRequest, { params }: IParams) {
  try {
    const supabase = await createServerLevelClient();
    const { id } = await params;
    const surveyId = parseSurveyId(id);
    if (surveyId == null) {
      return NextResponse.json({ message: "Invalid survey id" }, { status: 400 });
    }

    const { data, error } = await supabase.from("surveys").select("*").eq("id", surveyId).maybeSingle();

    if (error) {
      return NextResponse.json({ message: error.message }, { status: postgrestErrorToHttpStatus(error) });
    }
    if (!data) {
      return NextResponse.json({ message: "Not Found" }, { status: 404 });
    }

    return NextResponse.json({ data: data }, { status: 200 });
  } catch {
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

/**
 * PUT — update a survey's detail fields and/or its linked tree.
 *
 * The full field set is required (the modal always sends it); `task` and
 * `submitted_by` are immutable from the dashboard. RLS restricts updates to
 * admins — anyone else matches no row and gets a 404. Re-linking `tree` keeps
 * `trees.survey_logs` consistent via the surveys_move_tree_log trigger.
 */
export async function PUT(request: NextRequest, { params }: IParams) {
  try {
    const supabase = await createServerLevelClient();
    const { id } = await params;
    const surveyId = parseSurveyId(id);
    if (surveyId == null) {
      return NextResponse.json({ message: "Invalid survey id" }, { status: 400 });
    }

    let json: unknown;
    try {
      json = await request.json();
    } catch {
      return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 });
    }

    if (!isPlainObject(json) || !hasOnlyAllowedKeys(json, SURVEY_UPDATE_KEYS)) {
      return NextResponse.json({ message: `Only ${SURVEY_UPDATE_KEYS.join(", ")} can be updated.` }, { status: 400 });
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

    const update: SurveyUpdate = { tree: treeNum, ...parsed.fields };

    const { data, error } = await supabase.from("surveys").update(update).eq("id", surveyId).select("id").maybeSingle();

    if (error) {
      return NextResponse.json({ message: error.message }, { status: postgrestErrorToHttpStatus(error) });
    }
    if (!data) {
      return NextResponse.json(
        { message: "Survey not found or you do not have permission to edit it." },
        { status: 404 },
      );
    }

    return NextResponse.json({ data: data }, { status: 200 });
  } catch {
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

/**
 * DELETE — remove a survey. RLS restricts deletes to admins; anyone else
 * matches no row and gets a 404. The surveys_remove_tree_log trigger clears
 * the id from `trees.survey_logs`.
 */
export async function DELETE(req: NextRequest, { params }: IParams) {
  try {
    const supabase = await createServerLevelClient();
    const { id } = await params;
    const surveyId = parseSurveyId(id);
    if (surveyId == null) {
      return NextResponse.json({ message: "Invalid survey id" }, { status: 400 });
    }

    const { data, error } = await supabase.from("surveys").delete().eq("id", surveyId).select("id").maybeSingle();

    if (error) {
      return NextResponse.json({ message: error.message }, { status: postgrestErrorToHttpStatus(error) });
    }
    if (!data) {
      return NextResponse.json(
        { message: "Survey not found or you do not have permission to delete it." },
        { status: 404 },
      );
    }

    return NextResponse.json({ data: data }, { status: 200 });
  } catch {
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
