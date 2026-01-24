import { postgrestErrorToHttpStatus } from "@/database/utils";
import { supabase } from "@/supabase-client";
import { NextRequest, NextResponse } from "next/server";
import { Tables } from "@/database/database.types";

type IParams = {
  params: {
    id: string;
  };
};

/**
 * Admin GET API route for all volunteer information of specified ID.
 * @param {request: NextRequest, params: IParams}
 * @returns {message: string, status: number}
 */
export async function GET(request: NextRequest, { params }: IParams) {
  try {
    const { id } = await params;
    const { data, status, error } = await supabase.from("volunteers").select("*").eq("id", id).maybeSingle();

    if (error) {
      return NextResponse.json({ message: error.message }, { status: postgrestErrorToHttpStatus(error) });
    }

    return NextResponse.json({ message: data }, { status: status });
  } catch (error: any) {
    if (error instanceof Error) {
      return NextResponse.json({ message: error.message }, { status: 500 });
    }
    return NextResponse.json({ message: "Unexpected server error" }, { status: 500 });
  }
}

/**
 * Example PUT API route. REPLACE THIS DOCSTRING.
 * @returns {message: string}
 */
export async function PUT() {
  return NextResponse.json({ message: "Example volunteers slug PUT message" });
}

/**
 * Example DELETE API route. REPLACE THIS DOCSTRING.
 * @returns {message: string}
 */
export async function DELETE() {
  return NextResponse.json({ message: "Example volunteers slug DELETE message" });
}
