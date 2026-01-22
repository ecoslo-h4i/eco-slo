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
  return NextResponse.json({ message: "Example volunteers slug GET message" });
}

/**
 * PUT API ROUTE: Updates a volunteer record (what they do etc.) by their ID
 *
 * Takes a JSON request body that contains information neccesary to update a
 * volunteers information
 *
 * The volunteer is identified by their ID which is found in the params attribute
 *
 * Parameters:
 * @param request - the incoming JSON body that will be used to update the associated
 *                  volunteer
 * @param params - an object that contains parameters
 * @param params.id - the ID of the volunteer
 */
export async function PUT(request: NextRequest, { params }: { params: IParams }) {
  const id = params.params.id;
  const body = await request.json();
  const message = await supabase.from("volunteers").update(body).eq("id", id).select().single();

  if (message.error) {
    const status = postgrestErrorToHttpStatus(message.error);
    return NextResponse.json({ error: message.error }, { status });
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
