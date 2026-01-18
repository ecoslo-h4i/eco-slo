import { supabase } from "@/supabase-client";
import { NextResponse } from "next/server";
import { Database } from "@/database/database.types";
import { PostgrestError } from "@supabase/supabase-js";

type Volunteer = Database["public"]["Tables"]["volunteers"]["Row"];

/**
 * Admin GET API route for all volunteer information.
 * @returns {message: string, status: number}
 */
export async function GET() {
  try {
    const { data, error } = await supabase
      .from<"volunteers", Volunteer>("volunteers")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Supabase error fetching volunteers:", error.message);
      return NextResponse.json({ message: error.message }, { status: postgrestErrorToHttpStatus(error) });
    }

    const normalizedData: Volunteer[] = data ?? [];
    return NextResponse.json({ message: normalizedData }, { status: 200 });
  } catch (error) {
    console.error("Unexpected error in /api/admin/volunteers; ", error);
    return NextResponse.json({ message: "Unexpected server error" }, { status: 500 });
  }
}

/**
 * Example POST API route. REPLACE THIS DOCSTRING.
 * @returns {message: string}
 */
export async function POST() {
  return NextResponse.json({ message: "Example volunteers POST message" });
}

function postgrestErrorToHttpStatus(error: PostgrestError): number {
  switch (error.code) {
    case "42501":
      return 403;
    case "PGRST116":
      return 404;
    case "23505":
      return 409;
    case "22P02":
      return 400;
    default:
      return 500;
  }
}
