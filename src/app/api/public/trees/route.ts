import { createServerLevelClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { postgrestErrorToHttpStatus } from "@/database/utils";

/**
 * Example GET API route for public facing tree data.
 * @returns {message: string, status: number}
 */
export async function GET() {
  try {
    const supabase = await createServerLevelClient();
    const { data, error } = await supabase
      .from("public_trees")
      .select("id, latitude, longitude, ecoslo_num, species_name, common_name, date_planted, tree_keeper_id");

    if (error) {
      console.error("Supabase error fetching public trees:", error.message);
      return NextResponse.json({ message: error.message }, { status: postgrestErrorToHttpStatus(error) });
    }

    return NextResponse.json({ message: data }, { status: 200 });
  } catch (e) {
    console.error("Unexpected error in /api/public/trees GET", e);
    return NextResponse.json({ message: "Unexpected server error" }, { status: 500 });
  }
}
