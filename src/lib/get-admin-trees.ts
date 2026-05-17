import { TreeSchema } from "@/components/data-table/table-widget-defs";
import { createUserLevelClient } from "./supabase/client";

export async function getAdminTrees(): Promise<TreeSchema[]> {
  const supabase = createUserLevelClient();

  // 1. Fetch trees. RLS filters to:
  //    - Admins: all trees
  //    - Tree Keepers: only trees in their trees_assigned array
  const { data: trees, error: treesError } = await supabase
    .from("trees")
    .select("*")
    .order("created_at", { ascending: true });

  if (treesError) {
    throw new Error(treesError.message);
  }

  if (!trees || trees.length === 0) return [];

  // 2. Collect unique tree_keeper_ids referenced across all trees.
  const keeperIds = Array.from(new Set(trees.map((t) => t.tree_keeper_id).filter((id): id is number => id !== null)));

  // 3. Batch-fetch keeper info from members directly. RLS only returns
  //    the caller's own row (via members_self_select); other members
  //    silently drop out, leaving empty fields in the table for them.
  //    This is intentional — we don't expose other members' contact info
  //    to non-admin callers.
  //
  //    Admins see everyone via members_admin_all. The same query works
  //    for both roles; RLS does the filtering.
  let keeperById = new Map<number, { firstname: string; lastname: string; email: string; phone: string }>();

  if (keeperIds.length > 0) {
    const { data: keepers, error: keepersError } = await supabase
      .from("members")
      .select("id, firstname, lastname, email, phone")
      .in("id", keeperIds);

    if (keepersError) {
      console.error("[getAdminTrees] failed to fetch keeper info:", keepersError);
      // Non-fatal: render rows with empty keeper info rather than crashing.
    } else if (keepers) {
      keeperById = new Map(
        keepers.map((k) => [
          k.id,
          {
            firstname: k.firstname,
            lastname: k.lastname,
            email: k.email,
            phone: k.phone,
          },
        ]),
      );
    }
  }

  // 4. Attach keeper info to each tree. Missing keeper (either no
  //    tree_keeper_id, or RLS hid the row) renders as empty strings.
  return trees.map((tree) => {
    const keeper = tree.tree_keeper_id !== null ? keeperById.get(tree.tree_keeper_id) : undefined;

    return {
      ...tree,
      tree_keeper: {
        name: keeper ? `${keeper.firstname} ${keeper.lastname}`.trim() : "",
        email: keeper?.email ?? "",
        phone: keeper?.phone ?? "",
      },
    };
  });
}
