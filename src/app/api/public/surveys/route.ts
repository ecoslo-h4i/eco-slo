import { createServerLevelClient } from "@/lib/supabase/server";
import { Json, TablesInsert } from "@/database/database.types";
import { postgrestErrorToHttpStatus } from "@/database/utils";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type SurveyInsert = Pick<TablesInsert<"surveys">, "task" | "tree" | "body">;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * POST — insert `public.surveys` (`task`, `tree`, `body` jsonb).
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerLevelClient();
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 });
    }

    if (!isPlainObject(body)) {
      return NextResponse.json({ message: "Body must be a JSON object" }, { status: 400 });
    }

    const task = body.task;
    const tree = body.tree;
    const payloadBody = body.body;

    if (typeof task !== "number" || !Number.isFinite(task)) {
      return NextResponse.json({ message: "task must be a number (tasks.id)" }, { status: 400 });
    }
    if (tree != null && (typeof tree !== "number" || !Number.isFinite(tree))) {
      return NextResponse.json({ message: "tree must be a number (trees.ecoslo_num) or null" }, { status: 400 });
    }
    if (!isPlainObject(payloadBody)) {
      return NextResponse.json({ message: "body must be a JSON object" }, { status: 400 });
    }

    const treeNum: number | null = typeof tree === "number" ? tree : null;

    // Load the task to enforce survey-mode and linked-tree rules. RLS limits
    // this to the caller's own tasks (admins see all).
    const { data: taskRow, error: taskError } = await supabase
      .from("tasks")
      .select("id, assignees, tree_targets, survey_mode")
      .eq("id", task)
      .maybeSingle();

    if (taskError) {
      return NextResponse.json({ message: taskError.message }, { status: postgrestErrorToHttpStatus(taskError) });
    }
    if (!taskRow) {
      return NextResponse.json({ message: "Task not found." }, { status: 404 });
    }
    if (taskRow.survey_mode === "none") {
      return NextResponse.json({ message: "This task is not accepting surveys." }, { status: 400 });
    }

    const targets = taskRow.tree_targets ?? [];
    if (targets.length > 0) {
      if (treeNum == null) {
        return NextResponse.json({ message: "Select a linked tree for this survey." }, { status: 400 });
      }
      if (!targets.includes(treeNum)) {
        return NextResponse.json({ message: "That tree is not part of this task." }, { status: 400 });
      }
    } else if (treeNum != null) {
      const { data: treeRow, error: treeError } = await supabase
        .from("trees")
        .select("ecoslo_num, tree_keeper_id")
        .eq("ecoslo_num", treeNum)
        .maybeSingle();

      if (treeError) {
        return NextResponse.json({ message: treeError.message }, { status: postgrestErrorToHttpStatus(treeError) });
      }
      if (!treeRow || !taskRow.assignees?.includes(treeRow.tree_keeper_id ?? -1)) {
        return NextResponse.json({ message: "That tree is not assigned to this task's assignees." }, { status: 400 });
      }
    }

    const insert: SurveyInsert = {
      task,
      tree: treeNum,
      body: payloadBody as Json,
    };

    const { data, error } = await supabase.from("surveys").insert(insert).select("id, task, tree, body").single();

    if (error) {
      console.error("Supabase error inserting survey:", error.message);
      return NextResponse.json({ message: error.message }, { status: postgrestErrorToHttpStatus(error) });
    }

    // Advance required-survey progress and tree status where applicable. The
    // RPC re-validates ownership and authorization.
    const { error: rpcError } = await supabase.rpc("complete_task_survey", {
      p_task_id: task,
      p_tree: treeNum ?? undefined,
    });
    if (rpcError) {
      console.error("complete_task_survey RPC failed:", rpcError.message);
    }

    return NextResponse.json({ message: data }, { status: 201 });
  } catch (e) {
    console.error("Unexpected error in /api/public/surveys POST", e);
    return NextResponse.json({ message: "Unexpected server error" }, { status: 500 });
  }
}
