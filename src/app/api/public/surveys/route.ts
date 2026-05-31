import { createServerLevelClient } from "@/lib/supabase/server";
import { Json, TablesInsert } from "@/database/database.types";
import { postgrestErrorToHttpStatus } from "@/database/utils";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type SurveyInsert = Pick<TablesInsert<"surveys">, "task" | "tree" | "body">;

// Task types whose completion is driven per-tree and therefore require a
// survey to name the specific tree that was serviced.
const TREE_TASK_TYPES = ["Watering", "Mulching"] as const;

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

    // Load the task to enforce type-specific rules. RLS limits this to the
    // caller's own tasks (admins see all); a hidden or missing task falls
    // through to the insert below, whose RLS policy is the authoritative gate.
    const { data: taskRow } = await supabase
      .from("tasks")
      .select("id, type, is_complete, tree_targets")
      .eq("id", task)
      .maybeSingle();

    if (taskRow && (TREE_TASK_TYPES as readonly string[]).includes(taskRow.type)) {
      if (taskRow.is_complete) {
        return NextResponse.json({ message: "This task is already complete." }, { status: 409 });
      }
      if (treeNum == null) {
        return NextResponse.json({ message: "Select the tree you serviced to complete this task." }, { status: 400 });
      }

      // The chosen tree must be one of the task's snapshotted target trees.
      const targets = taskRow.tree_targets ?? [];
      if (!targets.includes(treeNum)) {
        return NextResponse.json({ message: "That tree is not part of this task." }, { status: 400 });
      }

      // One survey per tree: reject a repeat submission for the same tree.
      const { data: existing } = await supabase
        .from("surveys")
        .select("id")
        .eq("task", task)
        .eq("tree", treeNum)
        .limit(1);

      if (existing && existing.length > 0) {
        return NextResponse.json(
          { message: "You have already submitted a survey for this tree on this task." },
          { status: 409 },
        );
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

    // Advance task completion + tree status. The RPC re-validates ownership
    // and authorization, so it is the final gate regardless of the checks above.
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
