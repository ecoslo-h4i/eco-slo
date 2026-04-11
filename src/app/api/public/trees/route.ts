import { supabase } from "@/supabase-client";
import { NextResponse } from "next/server";
import { postgrestErrorToHttpStatus } from "@/database/utils";

/**
 * Example GET API route for public facing tree data.
 * @returns {message: string, status: number}
 */
export async function GET() {
  try {
    const { data, error } = await supabase
      .from("trees")
      .select("id, latitude, longitude, ecoslo_num, species_name, common_name, date_planted, adopter_name");

    if (error) {
      console.error("Supabase error fetching trees:", error.message);
      return NextResponse.json({ message: error.message }, { status: postgrestErrorToHttpStatus(error) });
    }

    return NextResponse.json({ message: data }, { status: 200 });
  } catch (e) {
    console.error("Unexpected error in /api/public/trees GET", e);
    return NextResponse.json({ message: "Unexpected server error" }, { status: 500 });
  }
}
