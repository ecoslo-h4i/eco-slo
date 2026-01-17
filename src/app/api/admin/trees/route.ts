import { TablesInsert } from "@/database/database.types";
import { createAuthenticatedClient } from "@/supabase-client";
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
    const authSupabase = createAuthenticatedClient(bearerToken);
    const json = await request.json();

    const body = json as TablesInsert<"trees">;
    const response = await authSupabase.from("trees").insert(body).select();
    return NextResponse.json({ message: response.data, info: response.error?.message }, { status: response.status });
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json({ message: null, info: error.message }, { status: 500 });
    }
  }
  return NextResponse.json({ message: null, info: null }, { status: 500 });
}
