import { createServerLevelClient } from "@/lib/supabase/server";
import { supabase } from "@/supabase-client";
import { redirect, RedirectType } from "next/navigation";
import { useRouter } from "next/router";
import { NextRequest, NextResponse } from "next/server";

interface MagicLinkRequest {
  email: string;
}

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const body = json as MagicLinkRequest;
    const email = body?.email;

    if (!email) {
      return NextResponse.json({ message: "Missing email" }, { status: 400 });
    }
    const client = await createServerLevelClient();
    const redirectTo = new URL("/dashboard", request.url).toString();

    const { data, error } = await client.auth.signInWithOtp({
      email: email,
      options: { shouldCreateUser: false, emailRedirectTo: redirectTo },
    });

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 401 });
    }
    return NextResponse.json({ message: `Sending email to ${email}` }, { status: 200 });
  } catch {
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
