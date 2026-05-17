import { createServerLevelClient } from "@/lib/supabase/server";
import { TablesInsert } from "@/database/database.types";
import { postgrestErrorToHttpStatus } from "@/database/utils";
import { NextRequest, NextResponse } from "next/server";

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
    const json = await request.json();
    const body = json as TablesInsert<"tasks">;

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
