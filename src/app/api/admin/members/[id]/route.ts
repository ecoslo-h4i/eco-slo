import { supabase } from "@/supabase-client";
import { NextRequest, NextResponse } from "next/server";
import { postgrestErrorToHttpStatus } from "@/database/utils";

type IParams = {
  params: Promise<{
    id: string;
  }>;
};

/**
 * GET API ROUTE: Fetch a single volunteer by ID
 *
 * Retrieves one volunteer record using the provided ID.
 *
 * Parameters:
 * @param params - route parameters
 * @param params.id - the ID of the volunteer
 *
 * Returns:
 * - 200 with { data } on success
 * - 404 if no volunteer is found
 * - 500 on server error
 */
export async function GET(_request: NextRequest, { params }: IParams) {
  try {
    const { id } = await params;

    const { data, error } = await supabase.from("members").select("*").eq("id", id).single();

    if (error) {
      const status = postgrestErrorToHttpStatus(error);
      return NextResponse.json({ error: error }, { status: status });
    }

    if (!data) {
      return NextResponse.json({ message: "Not Found" }, { status: 404 });
    }

    return NextResponse.json({ data: data }, { status: 200 });
  } catch {
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

/**
 * PUT API ROUTE: Updates a volunteer record by ID
 *
 * Updates a volunteer using the provided ID and request body.
 *
 * Parameters:
 * @param request - JSON body containing fields to update
 * @param params - route parameters
 * @param params.id - the ID of the volunteer
 *
 * Returns:
 * - 200 with { data } on success
 * - Supabase error with mapped status code
 * - 500 on server error
 */
export async function PUT(request: NextRequest, { params }: IParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    const { data, error } = await supabase.from("members").update(body).eq("id", id).select().single();

    if (error) {
      const status = postgrestErrorToHttpStatus(error);
      return NextResponse.json({ error: error }, { status: status });
    }

    return NextResponse.json({ data: data }, { status: 200 });
  } catch {
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

/**
 * DELETE API ROUTE: Deletes a volunteer by ID
 *
 * Removes a volunteer record using the provided ID.
 *
 * Parameters:
 * @param params - route parameters
 * @param params.id - the ID of the volunteer
 *
 * Returns:
 * - 200 with { data } containing the deleted volunteer
 * - Supabase error with mapped status code
 * - 500 on server error
 */
export async function DELETE(_request: NextRequest, { params }: IParams) {
  try {
    const { id } = await params;

    const { data, error } = await supabase.from("members").delete().eq("id", id).select().single();

    if (error) {
      const status = postgrestErrorToHttpStatus(error);
      return NextResponse.json({ error: error }, { status: status });
    }

    return NextResponse.json({ data: data }, { status: 200 });
  } catch {
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
