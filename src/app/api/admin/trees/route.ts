import { TablesInsert } from "@/database/database.types";
import { postgrestErrorToHttpStatus } from "@/database/utils";
import { createAuthenticatedClient, supabase } from "@/supabase-client";
import { NextRequest, NextResponse } from "next/server";

/**
 * Example GET API route. REPLACE THIS DOCSTRING.
 * @returns {message: string}
 */
export async function GET() {
  return NextResponse.json({ message: "Example trees GET message" });
}

export async function POST(request: NextRequest) {
  try {
    const bearerToken = request.headers.get("Authorization") ?? "";
    if (!bearerToken) {
      return NextResponse.json({ message: "Bearer token is missing in headers for POST request." }, { status: 401 });
    }
    const authSupabase = createAuthenticatedClient(bearerToken);
    const claims = await authSupabase.auth.getClaims(bearerToken);
    if (claims.data != null) {
      return NextResponse.json({ message: "Current session is not authenticated." }, { status: 401 });
    }
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
