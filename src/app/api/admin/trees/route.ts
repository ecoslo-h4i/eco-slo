import { supabase } from "@/supabase-client";
import { TablesInsert } from "@/database/database.types";
import { postgrestErrorToHttpStatus } from "@/database/utils";
import { createAuthenticatedClient } from "@/supabase-client";
import { NextRequest, NextResponse } from "next/server";
/**
 * Get all rows and columns of tree table as array of JS objects
 * @returns { message: Tree[], status: number } if successful
 * @returns { message: string, status: number } if error
 */
export async function GET() {
  try {
    const { data, error } = await supabase.from("trees").select("*").order("created_at", { ascending: true });
    if (error) {
      return NextResponse.json({ message: error.message }, { status: postgrestErrorToHttpStatus(error) });
    }
    return NextResponse.json({ message: data }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Unexpected server error" }, { status: 500 });
  }
}

/**
 * Admin POST API route to insert information into trees table.
 *
 * ### Authorization
 * Requires bearer token for authorization:
 * "Authorization: <Bearer Token (JWT)>"
 *
 * ### Body
 * Requires parameters from {@link TablesInsert}.
 *
 * @param request
 * @returns {message: string, status: number}
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization") ?? "";
    const bearerToken = authHeader.replace("Bearer ", "");
    if (!bearerToken) {
      return NextResponse.json({ message: "Bearer token is missing in headers for POST request." }, { status: 401 });
    }
    const authSupabase = createAuthenticatedClient(bearerToken);

    const json = await request.json();
    const body = json as TablesInsert<"trees">;
    const response = await authSupabase.from("trees").insert(body).select();

    if (response.error) {
      return NextResponse.json(
        { message: response.error.message },
        { status: postgrestErrorToHttpStatus(response.error) },
      );
    }
    return NextResponse.json({ message: response.data }, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json({ message: error.message }, { status: 500 });
    }
    return NextResponse.json({ message: "Unexpected server error" }, { status: 500 });
  }
}
