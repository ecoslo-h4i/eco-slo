import { TablesInsert } from "@/database/database.types";
import { postgrestErrorToHttpStatus } from "@/database/utils";
import { createAuthenticatedClient } from "@/supabase-client";
import { NextRequest, NextResponse } from "next/server";
/**
 * Example GET API route. REPLACE THIS DOCSTRING.
 * @returns {message: string}
 */
export async function GET() {
  return NextResponse.json({ message: "Example trees GET message" });
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
