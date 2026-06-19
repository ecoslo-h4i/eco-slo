import { createServerLevelClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { postgrestErrorToHttpStatus } from "@/database/utils";
import { TablesUpdate } from "@/database/database.types";

type IParams = {
  params: Promise<{
    id: string;
  }>;
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseNumberArray(value: unknown): number[] | null {
  if (!Array.isArray(value)) return null;
  const parsed = value.map((item) => Number(item));
  if (parsed.some((item) => !Number.isInteger(item) || item <= 0)) return null;
  return Array.from(new Set(parsed)).sort((a, b) => a - b);
}

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
    const taskId = Number(id);
    if (!Number.isFinite(taskId)) {
      return NextResponse.json({ message: "Invalid task id" }, { status: 400 });
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 });
    }

    if (!isPlainObject(body)) {
      return NextResponse.json({ message: "Body must be a JSON object" }, { status: 400 });
    }

    if (body.action === "complete") {
      const { error } = await supabase.rpc("complete_task", { p_task_id: taskId });
      if (error) {
        return NextResponse.json({ message: error.message }, { status: 400 });
      }

      const { data, error: selectError } = await supabase.from("tasks").select("*").eq("id", taskId).single();
      if (selectError) {
        return NextResponse.json({ error: selectError }, { status: postgrestErrorToHttpStatus(selectError) });
      }

      return NextResponse.json({ data }, { status: 200 });
    }

    const { data: existingTask, error: existingError } = await supabase
      .from("tasks")
      .select("id, tree_targets")
      .eq("id", taskId)
      .single();

    if (existingError) {
      return NextResponse.json({ error: existingError }, { status: postgrestErrorToHttpStatus(existingError) });
    }

    const update: TablesUpdate<"tasks"> = {};

    if (typeof body.title === "string") {
      const title = body.title.trim();
      if (!title) {
        return NextResponse.json({ message: "Title is required." }, { status: 400 });
      }
      update.title = title;
    }

    if (typeof body.message === "string") {
      update.message = body.message.trim();
    }

    if (Object.prototype.hasOwnProperty.call(body, "assignees")) {
      if ((existingTask.tree_targets?.length ?? 0) > 0) {
        return NextResponse.json(
          { message: "Assignees cannot be changed after linked trees are set." },
          { status: 400 },
        );
      }

      const assignees = parseNumberArray(body.assignees);
      if (!assignees) {
        return NextResponse.json({ message: "assignees must contain positive integer IDs." }, { status: 400 });
      }
      update.assignees = assignees;
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ message: "No editable task fields were provided." }, { status: 400 });
    }

    const { data, error } = await supabase.from("tasks").update(update).eq("id", taskId).select().single();

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
