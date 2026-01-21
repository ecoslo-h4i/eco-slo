import { supabase } from "@/supabase-client";
import { NextRequest, NextResponse } from "next/server";
import { postgrestErrorToHttpStatus } from "@/database/utils";

type Iparams = {
  id: string;
};

/**
 * Example GET API route. REPLACE THIS DOCSTRING.
 * @returns {message: string}
 */
export async function GET() {
  return NextResponse.json({ message: "Example volunteers slug GET message" });
}

/**
 * Example PUT API route. REPLACE THIS DOCSTRING.
 * @returns {message: string}
 */
export async function PUT(request: NextRequest, params: Iparams) {
  const id = params.id;
  const body = await request.json();
  const message = await supabase.from("volunteers").update(body).eq("id", id).select().single();

  if (message.error) {
    const status = postgrestErrorToHttpStatus(message.error);
    return NextResponse.json({ error: message.error.message }, { status });
  }

  return NextResponse.json({ message: message.data }, { status: 200 });
}

/**
 * Example DELETE API route. REPLACE THIS DOCSTRING.
 * @returns {message: string}
 */
export async function DELETE() {
  return NextResponse.json({ message: "Example volunteers slug DELETE message" });
}
