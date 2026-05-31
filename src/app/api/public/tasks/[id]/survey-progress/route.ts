import { createServerLevelClient } from "@/lib/supabase/server";
import { postgrestErrorToHttpStatus } from "@/database/utils";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type IParams = { params: Promise<{ id: string }> };

type ProgressTree = { ecoslo_num: number; label: string; surveyed: boolean };

function treeLabel(ecoslo_num: number, common_name: string | null, species_name: string | null): string {
  const primary = common_name?.trim() || species_name?.trim() || "Tree";
  return `#${ecoslo_num} — ${primary}`;
}

/**
 * GET — per-tree survey progress for a Watering/Mulching task.
 *
 * Reads the task's frozen `tree_targets` snapshot, cross-references the surveys
 * already submitted for the task, and returns the checklist the survey form
 * renders. RLS scopes this to the caller's own tasks (admins see all); the
 * computation runs server-side so it is correct for admins too (who otherwise
 * would not have the assignee's trees via tree-keeper RLS).
 */
export async function GET(_req: NextRequest, { params }: IParams) {
  try {
    const { id } = await params;
    const taskId = Number(id);
    if (!Number.isFinite(taskId)) {
      return NextResponse.json({ message: "Invalid task id" }, { status: 400 });
    }

    const supabase = await createServerLevelClient();

    const { data: task, error: taskError } = await supabase
      .from("tasks")
      .select("id, type, tree_targets")
      .eq("id", taskId)
      .maybeSingle();

    if (taskError) {
      return NextResponse.json({ message: taskError.message }, { status: postgrestErrorToHttpStatus(taskError) });
    }
    if (!task) {
      return NextResponse.json({ message: "Task not found" }, { status: 404 });
    }

    const targets: number[] = task.tree_targets ?? [];

    // Trees already surveyed for this task.
    const { data: surveyed } = await supabase.from("surveys").select("tree").eq("task", taskId).not("tree", "is", null);

    const surveyedSet = new Set<number>(
      (surveyed ?? []).map((s) => s.tree).filter((t): t is number => typeof t === "number"),
    );

    // Tree display metadata. RLS may hide a target reassigned away from a
    // keeper; those fall back to the bare "#<num>" label.
    const meta = new Map<number, { common_name: string | null; species_name: string | null }>();
    if (targets.length > 0) {
      const { data: treeRows } = await supabase
        .from("trees")
        .select("ecoslo_num, common_name, species_name")
        .in("ecoslo_num", targets);
      for (const r of treeRows ?? []) {
        meta.set(r.ecoslo_num, { common_name: r.common_name, species_name: r.species_name });
      }
    }

    const trees: ProgressTree[] = [...targets]
      .sort((a, b) => a - b)
      .map((ecoslo_num) => {
        const m = meta.get(ecoslo_num);
        return {
          ecoslo_num,
          label: m ? treeLabel(ecoslo_num, m.common_name, m.species_name) : `#${ecoslo_num}`,
          surveyed: surveyedSet.has(ecoslo_num),
        };
      });

    const completed = trees.filter((t) => t.surveyed).length;

    return NextResponse.json({ message: { total: trees.length, completed, trees } }, { status: 200 });
  } catch (e) {
    console.error("Unexpected error in /api/public/tasks/[id]/survey-progress GET", e);
    return NextResponse.json({ message: "Unexpected server error" }, { status: 500 });
  }
}
