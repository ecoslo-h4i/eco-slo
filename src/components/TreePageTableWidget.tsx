"use client";

import { type MutableRefObject, useEffect, useState } from "react";
import { treeColumns, TreeSchema } from "./data-table/table-widget-defs";
import { Table } from "./data-table/table/table-types";
import TreePageTable from "./data-table/tree-page-table";
import { getAdminTrees } from "@/lib/get-admin-trees";

function TreePageTableWidget({
  className,
  onRowClick,
  onTableReady,
  refetchRef,
}: {
  className?: string;
  onRowClick: (e: React.MouseEvent<HTMLTableRowElement, MouseEvent>, tree: TreeSchema) => void;
  onTableReady?: (table: Table<TreeSchema>) => void;
  refetchRef?: MutableRefObject<(() => void) | null>;
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

  useEffect(() => {
    if (!refetchRef) return;
    refetchRef.current = async () => {
      const data = await getAdminTrees();
      setTrees(data);
    };
  }, [refetchRef]);

  return (
    <div className={`min-w-0 flex flex-col ${className || ""}`}>
      <div className="flex-1 min-h-0 min-w-0 flex flex-col">
        {error ? (
          <div className="w-full h-full flex justify-center items-center text-danger">{error}</div>
        ) : (
          <TreePageTable
            className="w-full max-w-full min-w-0"
            onRowClick={onRowClick}
            onTableReady={onTableReady}
            data={trees}
            cols={treeColumns}
            isLoading={isLoading}
          />
        )}
      </div>
    </div>
  );
}

export default TreePageTableWidget;
