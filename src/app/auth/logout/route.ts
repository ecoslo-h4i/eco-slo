import { createServerLevelClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// POST /auth/logout
// Invalidates the refresh token server-side and clears the auth cookies
// via the SSR adapter. Client navigates after the response resolves.
export async function POST() {
  try {
    const supabase = await createServerLevelClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("[logout] signOut failed:", error);
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: "Signed out" }, { status: 200 });
  } catch (error) {
    console.error("[logout] unexpected error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

export function GET() {
  return NextResponse.json({ message: "Method Not Allowed. Use POST." }, { status: 405 });
}
