import { createServerLevelClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

interface MagicLinkRequest {
  email: string;
}

export function GET() {
  return NextResponse.json({ message: "Method Not Allowed. Use POST with a JSON body." }, { status: 405 });
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Partial<MagicLinkRequest>;
    const email = body?.email?.trim();

    if (!email) {
      return NextResponse.json({ message: "Missing email" }, { status: 400 });
    }

    const client = await createServerLevelClient();
    const redirectTo = new URL("/auth/callback", request.url).toString();

    const { error } = await client.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false, emailRedirectTo: redirectTo },
    });

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 401 });
    }
    return NextResponse.json({ message: `Sending email to ${email}` }, { status: 200 });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ message: error.message }, { status: 500 });
    }
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
