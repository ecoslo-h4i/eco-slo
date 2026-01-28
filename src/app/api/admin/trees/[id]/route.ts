import { supabase } from "@/supabase-client";
import { NextRequest, NextResponse } from "next/server";
import { postgrestErrorToHttpStatus } from "@/database/utils";

type IParams = {
  params: {
    id: string;
  };
};

/**
 * Returns a single tree row by id
 * @returns { body: Tree[], status: number } if successful
 * @returns { message: string, status: number} if error
 * @returns {message: null, status: number} if tree not found
 */
export async function GET(req: NextRequest, { params }: IParams) {
  const { id } = await params;

  try {
    const message = await supabase.from("trees").select().eq("id", id).maybeSingle();
    if (message.error) {
      return NextResponse.json({ error: message.error }, { status: postgrestErrorToHttpStatus(message.error) });
    }

    return NextResponse.json({ message: message.data }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Unexpected Server Error" }, { status: 500 });
  }
}

/**
 * Updates and return a single tree row by id
 * @returns { body: Tree[], status: number } if successful
 * @returns { message: string, status: number} if error
 */
export async function PUT(req: NextRequest, { params }: IParams) {
  const { id } = await params;
  const body = await req.json();
  try {
    const message = await supabase.from("trees").update(body).eq("id", id).select().single();

    if (message.error) {
      return NextResponse.json({ error: message.error }, { status: postgrestErrorToHttpStatus(message.error) });
    }

    return NextResponse.json({ message: message.data }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Unexpected Server Error" }, { status: 500 });
  }
}

/**
 * Example DELETE API route. REPLACE THIS DOCSTRING.
 * @returns {message: string}
 */
export async function DELETE() {
  return NextResponse.json({ message: "Example trees slug DELETE message" });
}
