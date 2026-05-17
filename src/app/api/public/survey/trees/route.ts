import { createServerLevelClient } from "@/lib/supabase/server";
import { postgrestErrorToHttpStatus } from "@/database/utils";
import type { SurveyTreeOption } from "@/types/survey";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * GET — minimal tree fields for the survey tree selector only (`surveys.tree` → `trees.ecoslo_num`).
 * Does not replace `GET /api/public/trees` (used elsewhere).
 */
export async function GET() {
  try {
    const supabase = await createServerLevelClient();
    const { data, error } = await supabase
      .from("trees")
      .select("ecoslo_num, common_name, species_name")
      .order("ecoslo_num", { ascending: true });

    if (error) {
      console.error("Supabase error fetching survey trees:", error.message);
      return NextResponse.json({ message: error.message }, { status: postgrestErrorToHttpStatus(error) });
    }

    const trees = (data ?? []) as SurveyTreeOption[];

    return NextResponse.json({ message: trees }, { status: 200 });
  } catch (e) {
    console.error("Unexpected error in /api/public/survey/trees GET", e);
    return NextResponse.json({ message: "Unexpected server error" }, { status: 500 });
  }
}
