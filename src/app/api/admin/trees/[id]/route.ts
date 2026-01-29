import { supabase } from "@/supabase-client";
import { NextRequest, NextResponse } from "next/server";
import { postgrestErrorToHttpStatus } from "@/database/utils";

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
    return NextResponse.json({ message: "Unexpected Server Error" });
  }
}

/**
 * Deletes one tree row by id, returns deleted tree
 * @returns { message: Tree, status: number } if successful
 * @returns { message: string, status: number } if error
 */
export async function DELETE(req: NextRequest, { params }: IParams) {
  try {
    const { id } = await params;
    const { data, error } = await supabase.from("trees").delete().eq("id", id).limit(1).select().single();

    if (error) {
      return NextResponse.json({ message: error.message }, { status: postgrestErrorToHttpStatus(error) });
    }

    return NextResponse.json({ message: data }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Unexpected Server Error" }, { status: 500 });
  }
}
