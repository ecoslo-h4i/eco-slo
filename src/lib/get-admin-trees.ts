import { Database } from "@/database/database.types";
import { TreeSchema } from "@/components/data-table/table-widget-defs";

type AdminTreeKeeperResponse = {
  firstname?: string | null;
  lastname?: string | null;
  email?: string | null;
  phone?: string | null;
} | null;

type AdminTreeResponseRow = Database["public"]["Tables"]["trees"]["Row"] & {
  tree_keeper: AdminTreeKeeperResponse;
};

type AdminTreesResponse = {
  message?: AdminTreeResponseRow[] | string;
  error?: string;
};

export async function getAdminTrees(): Promise<TreeSchema[]> {
  const response = await fetch("/api/admin/trees");
  const payload = (await response.json()) as AdminTreesResponse;

  if (!response.ok) {
    throw new Error(payload.error ?? String(payload.message ?? "Failed to load trees"));
  }

  if (!Array.isArray(payload.message)) return [];

  return payload.message.map((tree) => {
    const treeKeeper = tree.tree_keeper;

    return {
      ...tree,
      tree_keeper: {
        name: treeKeeper ? [treeKeeper.firstname, treeKeeper.lastname].filter(Boolean).join(" ") : "",
        email: treeKeeper?.email ?? "",
        phone: treeKeeper?.phone ?? "",
      },
    };
  });
}
