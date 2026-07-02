import { createServerLevelClient, createServiceRoleClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { postgrestErrorToHttpStatus } from "@/database/utils";

type IParams = {
  params: Promise<{
    id: string;
  }>;
};

/**
 * GET API ROUTE: Fetch a single tree row by ID
 *
 * Retrieves one tree row using the provided ID.
 *
 * Parameters:
 * @param params - route parameters
 * @param params.id - the ID of the tree
 *
 * Returns:
 * - 200 with { message } on success
 * - 404 if no tree is found
 * - 500 on server error
 */
export async function GET(req: NextRequest, { params }: IParams) {
  const { id } = await params;

  try {
    const supabase = await createServerLevelClient();
    const { data, error } = await supabase.from("trees").select().eq("id", id).single();
    if (error) {
      const status = postgrestErrorToHttpStatus(error);
      return NextResponse.json({ error: error }, { status: status });
    }
    return NextResponse.json({ message: data }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

/**
 * PUT API ROUTE: Updates a single tree by ID
 *
 * Updates a tree record using the provided ID and request body.
 *
 * Parameters:
 * @param request - JSON body containing fields to update
 * @param params - route parameters
 * @param params.id - the ID of the tree
 *
 * Returns:
 * - 200 with { message } on success
 * - Supabase error with mapped status code
 * - 500 on server error
 */
export async function PUT(req: NextRequest, { params }: IParams) {
  try {
    const supabase = await createServerLevelClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const { data: isAdminRow } = await supabase.rpc("is_admin");
    if (!isAdminRow) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();

    const { data, error } = await supabase.from("trees").update(body).eq("id", id).select().single();

    if (error) {
      const status = postgrestErrorToHttpStatus(error);
      return NextResponse.json({ error: error }, { status: status });
    }
    return NextResponse.json({ message: data }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

/**
 * DELETE API ROUTE: Deletes a tree row by ID
 *
 * Removes a tree row using the provided ID.
 *
 * Parameters:
 * @param params - route parameters
 * @param params.id - the ID of the tree
 *
 * Returns:
 * - 200 with { data } containing the deleted tree
 * - Supabase error with mapped status code on error
 * - 500 on server error
 */
export async function DELETE(req: NextRequest, { params }: IParams) {
  try {
    const supabase = await createServerLevelClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const { data: isAdminRow } = await supabase.rpc("is_admin");
    if (!isAdminRow) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const { data, error } = await supabase.from("trees").delete().eq("id", id).limit(1).select().single();

    if (error) {
      const status = postgrestErrorToHttpStatus(error);
      return NextResponse.json({ message: error.message }, { status: status });
    }

    if (data && typeof data.ecoslo_num === "number") {
      const adminClient = await createServiceRoleClient();
      const ecosloNum = data.ecoslo_num;

      const { data: affectedMembers, error: lookupError } = await adminClient
        .from("members")
        .select("id, trees_assigned")
        .contains("trees_assigned", [ecosloNum]);

      if (lookupError) {
        console.error("[trees DELETE] failed to find members with deleted tree:", lookupError);
      } else if (affectedMembers) {
        for (const member of affectedMembers) {
          const currentTrees: number[] = Array.isArray(member.trees_assigned)
            ? member.trees_assigned.filter((n: unknown): n is number => typeof n === "number")
            : [];
          const cleaned = currentTrees.filter((n) => n !== ecosloNum);

          const { error: cleanupError } = await adminClient
            .from("members")
            .update({ trees_assigned: cleaned, trees_count: cleaned.length })
            .eq("id", member.id);

          if (cleanupError) {
            console.error("[trees DELETE] failed to clean up member", member.id, cleanupError);
          }
        }
      }

      const { data: affectedTasks, error: taskLookupError } = await adminClient
        .from("tasks")
        .select("id, tree_targets")
        .contains("tree_targets", [ecosloNum]);

      if (taskLookupError) {
        console.error("[trees DELETE] failed to find tasks with deleted tree:", taskLookupError);
      } else if (affectedTasks) {
        for (const task of affectedTasks) {
          const currentTargets: number[] = Array.isArray(task.tree_targets)
            ? task.tree_targets.filter((n: unknown): n is number => typeof n === "number")
            : [];
          const cleaned = currentTargets.filter((n) => n !== ecosloNum);

          const { error: cleanupError } = await adminClient
            .from("tasks")
            .update({ tree_targets: cleaned })
            .eq("id", task.id);

          if (cleanupError) {
            console.error("[trees DELETE] failed to clean up task", task.id, cleanupError);
          }
        }
      }
    }

    return NextResponse.json({ message: data }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
