import { createServerLevelClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { postgrestErrorToHttpStatus } from "@/database/utils";

type IParams = {
  params: Promise<{
    id: string;
  }>;
};

/**
 * GET API ROUTE: Fetch a single task by ID
 *
 * Retrieves one task using the provided ID.
 *
 * Parameters:
 * @param params - route parameters
 * @param params.id - the ID of the task
 *
 * Returns:
 * - 200 with { data } on success
 * - 404 if no task is found
 * - 500 on server error
 */
export async function GET(req: NextRequest, { params }: IParams) {
  const { id } = await params;

  try {
    const supabase = await createServerLevelClient();
    const { data, error } = await supabase.from("tasks").select().eq("id", id).single();
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
 * PUT API ROUTE: Updates a single task by ID
 *
 * Updates a task using the provided ID and request body.
 *
 * Parameters:
 * @param request - JSON body containing fields to update
 * @param params - route parameters
 * @param params.id - the ID of the task
 *
 * Returns:
 * - 200 with { data } on success
 * - Supabase error with mapped status code on error
 * - 500 on server error
 */
export async function PUT(req: NextRequest, { params }: IParams) {
  try {
    const supabase = await createServerLevelClient();
    const { id } = await params;
    const body = await req.json();

    const { data, error } = await supabase.from("tasks").update(body).eq("id", id).select().single();

    if (error) {
      const status = postgrestErrorToHttpStatus(error);
      return NextResponse.json({ error: error }, { status: status });
    }
    return NextResponse.json({ data: data }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

/**
 * DELETE API ROUTE: Deletes a task by ID
 *
 * Removes a task using the provided ID.
 *
 * Parameters:
 * @param params - route parameters
 * @param params.id - the ID of the task
 *
 * Returns:
 * - 200 with { data } containing the deleted task
 * - Supabase error with mapped status code on error
 * - 500 on server error
 */
export async function DELETE(req: NextRequest, { params }: IParams) {
  try {
    const supabase = await createServerLevelClient();
    const { id } = await params;
    const { data, error } = await supabase.from("tasks").delete().eq("id", id).limit(1).select().single();

    if (error) {
      return NextResponse.json({ message: error.message }, { status: postgrestErrorToHttpStatus(error) });
    }

    return NextResponse.json({ message: data }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Unexpected Server Error" }, { status: 500 });
  }
}
