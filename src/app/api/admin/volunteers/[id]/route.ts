import { supabase } from "@/supabase-client";
import { NextRequest, NextResponse } from "next/server";
import { postgrestErrorToHttpStatus } from "@/database/utils";

type IParams = {
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

    return NextResponse.json({ message: message.data }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Unexpected server error" }, { status: 500 });
  }
}

/**
 * DELETE API ROUTE: Deletes a volunteer record by their ID
 *
 * Removes a volunteer from the database using the provided volunteer ID.
 *
 * The volunteer is identified by their ID which is found in the params attribute.
 *
 * Parameters:
 * @param request - the incoming request (not used for DELETE)
 * @param params - an object that contains parameters
 * @param params.id - the ID of the volunteer to delete*/

export async function DELETE(_request: NextRequest, { params }: { params: IParams }) {
  try {
    const id = params.id;

    if (!id) {
      return NextResponse.json({ message: "Volunteer ID is required" }, { status: 422 });
    }

    const message = await supabase.from("volunteers").delete().eq("id", id).select().single();

    if (message.error) {
      const status = postgrestErrorToHttpStatus(message.error);
      return NextResponse.json({ error: message.error }, { status });
    }

    return NextResponse.json({ message: message.data }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Unexpected server error" }, { status: 500 });
  }
}
