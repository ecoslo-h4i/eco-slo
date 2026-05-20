"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { dashboardTreeColumns, TreeSchema } from "./data-table/table-widget-defs";
import TreeDashboardTable from "./data-table/tree-dashboard-table";
import { getAdminTrees } from "@/lib/get-admin-trees";

function TreeDashboardWidget({ className }: { className?: string }) {
  const [trees, setTrees] = useState<TreeSchema[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const data = (await getAdminTrees()).slice(0, 5);
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
    <div className={`${className} p-8`}>
      <div className="w-full h-full flex flex-col gap-y-6">
        <div className="flex justify-between shrink-0">
          <h2 className="text-5xl font-serif">Trees</h2>
          <Link
            href="/trees"
            aria-label="Go to Trees page"
            className="rounded-full size-14 bg-transparent transition-all duration-200 ease-out hover:bg-black/10 cursor-pointer flex justify-center items-center items-center"
          >
            <img src="/icons/tree.svg" alt="To Tree Page" className="size-10 invert" />
          </Link>
        </div>
        <div className="h-[0.1rem] w-full bg-border-strong"></div>
        <div className="flex-1 min-h-0 flex flex-col">
          {error ? (
            <div className="w-full h-full flex justify-center items-center text-danger">{error}</div>
          ) : (
            <TreeDashboardTable className="w-full" data={trees} cols={dashboardTreeColumns} />
          )}
        </div>
      </div>
    </div>
  );
}

export default TreeDashboardWidget;
