import { createServerLevelClient } from "@/lib/supabase/server";
import { isRedirectError } from "next/dist/client/components/redirect";
import { redirect } from "next/navigation";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const code = new URL(request.url).searchParams.get("code") as string;
    if (!code) {
      return NextResponse.json({ message: "Code not found for authentication" }, { status: 400 });
    }

    const client = await createServerLevelClient();
    const { data, error } = await client.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    if (!data.session || !data.user) {
      return NextResponse.json({ message: "User invalid" }, { status: 400 });
    }
    redirect("/dashboard");
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }

    if (error instanceof Error) {
      return NextResponse.json({ message: error.message }, { status: 500 });
    }
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
