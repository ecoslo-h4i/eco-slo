"use client";

import { useEffect, useState } from "react";
import { dashboardTreeColumns, treeColumns, TreeSchema } from "./data-table/table-widget-defs";
import { Table } from "./data-table/table/table-types";
import TreePageTable from "./data-table/tree-page-table";

type AdminTreesResponse = {
  message?: TreeSchema[] | string;
  error?: string;
};

export async function getAdminTrees(): Promise<TreeSchema[]> {
  const response = await fetch("/api/admin/trees");
  const payload = (await response.json()) as AdminTreesResponse;

  if (!response.ok) throw new Error(payload.error ?? String(payload.message ?? "Failed to load trees"));
  return Array.isArray(payload.message) ? payload.message : [];
}

function TreePageTableWidget({
  className,
  onRowClick,
  onTableReady,
}: {
  className?: string;
  onRowClick: (e: React.MouseEvent<HTMLTableRowElement, MouseEvent>, tree: TreeSchema) => void;
  onTableReady?: (table: Table<TreeSchema>) => void;
}) {
  const [trees, setTrees] = useState<TreeSchema[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const data = await getAdminTrees();
        if (mounted) {
          setTrees(data);
          setError(null);
        }
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : "Failed to load trees");
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className={`min-w-0 flex flex-col overflow-hidden ${className || ""}`}>
      <div className="flex-1 min-h-0 min-w-0 flex flex-col">
        {error ? (
          <div className="w-full h-full flex justify-center items-center text-red-500">{error}</div>
        ) : (
          <TreePageTable
            className="w-full max-w-full min-w-0 h-[80vh]"
            onRowClick={onRowClick}
            onTableReady={onTableReady}
            data={trees}
            cols={treeColumns}
          />
        )}
      </div>
    </div>
  );
}

export default TreePageTableWidget;
