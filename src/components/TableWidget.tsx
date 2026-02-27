"use client";

import React from "react";
import TreePreviewTable from "@/components/data-table/tree-preview-table";
import { treeDashboardData } from "./data-table/tree-widget-data";
import { columns } from "./data-table/table-widget-defs";
import MoveRightIcon from "./MoveRightIcon";

function DashboardTreeWidget({ className }: { className?: string }) {
  return (
    <div className={`${className} w-full h-full bg-card space-y-4 px-12 py-8 rounded-2xl`}>
      <div className="flex justify-between items-center">
        <h2 className="text-5xl font-serif">Trees</h2>
        <button
          className="px-6 py-4 bg-primary text-background-accent flex items-center justify-center rounded-xl
                      hover:bg-primary/90"
        >
          <span className="font-medium">
            <span>Go to Dashboard</span>
            <MoveRightIcon className="ml-2 size-5" />
          </span>
        </button>
      </div>
      <TreePreviewTable data={treeDashboardData} cols={columns} />
    </div>
  );
}

export default DashboardTreeWidget;
