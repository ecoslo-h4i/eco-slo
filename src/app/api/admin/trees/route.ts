import { supabase, createAuthenticatedClient } from "@/supabase-client";
import { TablesInsert } from "@/database/database.types";
import { postgrestErrorToHttpStatus } from "@/database/utils";
import { NextRequest, NextResponse } from "next/server";
/**
 * GET API ROUTE: Retrieves all trees from the database
 *
 * Fetches all rows and columns from the trees table, sorted by creation date ascending.
 *
 * Parameters: none
 *
 * Returns:
 * - 200 with { data } on success
 * - 404 on no data found
 * - Supabase error with mapped status code { data: null, error: string }
 * - 500 on server error { data: null, error: "Internal Server Error" }
 */
export async function GET() {
  try {
    const { data, error } = await supabase.from("trees").select("*").order("created_at", { ascending: true });
    if (error) {
      const status = postgrestErrorToHttpStatus(error);
      return NextResponse.json({ message: error.message }, { status: status });
    }
    if (data == null || data.length == 0) {
      return NextResponse.json({ error: "No Data Found" }, { status: 404 });
    }
    return NextResponse.json({ message: data }, { status: 200 });
  } catch {
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

/**
 * POST API ROUTE: Creates a new tree record
 *
 * Inserts a new row into the trees table using the JSON body from the request.
 *
 * Parameters:
 * @param request - JSON body containing fields to insert, matching {@link TablesInsert<"trees">}
 *
 * Returns:
 * - 200 with { data: Tree[] } on success
 * - Supabase error with mapped status code { data: null, error: string }
 * - 500 on server error { data: null, error: "Internal Server Error" }
 */
export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const body = json as TablesInsert<"trees">;

    const { data, error } = await supabase.from("trees").insert(body).select();

    if (error) {
      const status = postgrestErrorToHttpStatus(error);
      return NextResponse.json({ error: error }, { status: status });
    }

    return NextResponse.json({ data: data }, { status: 200 });
  } catch {
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
