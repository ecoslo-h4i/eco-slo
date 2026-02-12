import { supabase } from "@/supabase-client";
import { NextResponse } from "next/server";
import { Database } from "@/database/database.types";
import { postgrestErrorToHttpStatus } from "@/database/utils";

type Volunteer = Database["public"]["Tables"]["volunteers"]["Row"];

/**
 * GET API ROUTE: Retrieves all volunteers from the database
 *
 * Fetches all rows and columns from the volunteers table, sorted by creation date ascending.
 *
 * Parameters: none
 *
 * Returns:
 * - 200 with { data: Volunteer[] } on success
 * - 404 with { data: null, error: "Not Found" } if no volunteers exist
 * - Supabase error with mapped status code { data: null, error: string }
 * - 500 on server error { data: null, error: "Internal Server Error" }
 */
export async function GET() {
  try {
    const { data, error } = await supabase
      .from<"volunteers", Volunteer>("volunteers")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      const status = postgrestErrorToHttpStatus(error);
      return NextResponse.json({ error: error }, { status: status });
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ data: null, error: "Not Found" }, { status: 404 });
    }

    NextResponse.json({ data: data }, { status: 200 });
  } catch (error) {
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
