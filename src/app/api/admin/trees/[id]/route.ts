import { supabase } from "@/supabase-client";
import { NextRequest, NextResponse } from "next/server";

type IParams = {
  params: {
    id: string;
  };
};

/**
 * Example GET API route. REPLACE THIS DOCSTRING.
 * @returns {message: string}
 */
export async function GET() {
  return NextResponse.json({ message: "Example trees slug GET message" });
}

/**
 * Updates a single tree row by id
 * @returns {Respone} - All data within the updated tree
 */
export async function PUT(req: NextRequest, { params }: IParams) {
  const { id } = await params;
  const body = await req.json();
  const message = await supabase.from("trees").update(body).eq("id", id).select().single();

  if (message.error) {
    return NextResponse.json({ error: message.error }, { status: 404 });
  }
  return NextResponse.json({ message: message.data }, { status: 200 });
}

/**
 * Example DELETE API route. REPLACE THIS DOCSTRING.
 * @returns {message: string}
 */
export async function DELETE() {
  return NextResponse.json({ message: "Example trees slug DELETE message" });
}
