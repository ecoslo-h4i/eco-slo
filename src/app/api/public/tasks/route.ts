import { createServerLevelClient } from "@/lib/supabase/server";
import { postgrestErrorToHttpStatus } from "@/database/utils";
import type { SurveyTaskOption } from "@/types/survey";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function rowToOption(row: Record<string, unknown>): SurveyTaskOption {
  const id = Number(row.id);
  const label =
    (typeof row.title === "string" && row.title) ||
    (typeof row.name === "string" && row.name) ||
    (typeof row.label === "string" && row.label) ||
    `Task ${Number.isFinite(id) ? id : "?"}`;
  return { id: Number.isFinite(id) ? id : 0, label };
}

/**
 * GET — task list for public selectors (`surveys.task` references `tasks.id`).
 */
export async function GET() {
  const supabase = await createServerLevelClient();
  try {
    const { data, error } = await supabase
      .from("tasks")
      .select("id, title, survey_mode")
      .neq("survey_mode", "none")
      .order("id", { ascending: true });

    if (error) {
      console.error("Supabase error fetching tasks:", error.message);
      return NextResponse.json({ message: error.message }, { status: postgrestErrorToHttpStatus(error) });
    }

    const tasks: SurveyTaskOption[] = (data ?? [])
      .map((row) => rowToOption(row as Record<string, unknown>))
      .filter((t) => Number.isFinite(t.id) && t.id > 0);

    return NextResponse.json({ message: tasks }, { status: 200 });
  } catch (e) {
    console.error("Unexpected error in /api/public/tasks GET", e);
    return NextResponse.json({ message: "Unexpected server error" }, { status: 500 });
  }
}
