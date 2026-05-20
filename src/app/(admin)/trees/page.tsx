"use client";
import TreePageTableWidget from "@/components/TreePageTableWidget";
import ControlPanel from "@/components/ControlPanel";
import { useState } from "react";
import { TreeSchema } from "@/components/data-table/table-widget-defs";
import TreeDetailsPopout from "@/components/TreeDetailsPopout";
import { useRef } from "react";
import { Table } from "@/components/data-table/table/table-types";
import { Download, Plus } from "lucide-react";
import { downloadTreeCSV, dataToCSV } from "./utils/csv";

export default function Trees() {
  const [currentTree, setCurrentTree] = useState<TreeSchema | null>(null);
  const tableRef = useRef<Table<TreeSchema> | null>(null);

  return (
    <main className="flex-1 min-w-0 bg-background" onClick={() => setCurrentTree(null)}>
      <div className="fixed top-3 -right-100 h-auto w-auto z-30 ">
        <TreeDetailsPopout
          key={currentTree != null ? String(currentTree.id) : "closed"}
          admin={true}
          tree={currentTree != null ? currentTree : undefined}
          onClose={() => setCurrentTree(null)}
        />
      </div>
      <div className="flex flex-col gap-y-8 px-6 py-10">
        {/* header */}
        <header className="w-full flex items-center justify-between pb-2">
          <h1 className="text-5xl font-serif font-semibold leading-none">Trees</h1>
          <div className="flex gap-4 items-center">
            <button
              className="flex items-center gap-x-2 px-4 py-2 text-text-dark bg-button-light border border-border shadow-xs rounded-full hover:bg-button-light/60 transition-colors duration-100"
              onClick={() => {
                downloadTreeCSV(
                  dataToCSV(
                    tableRef?.current?.getRowModels().map((rowModel) => {
                      const row: Record<string, unknown> = {};
                      rowModel.cells.forEach((cell) => {
                        row[cell.column.id] = cell.value;
                      });
                      return row;
                    }) ?? [],
                  ),
                );
              }}
            >
              <span className="font-medium">Export CSV</span>
              <Download className="w-4 h-4" />
            </button>
            <button className="flex items-center gap-x-2 px-4 py-2 bg-primary text-text-light border border-border text-text-dark rounded-full hover:bg-primary/90 transition-colors duration-100">
              <span className="font-medium">Add Tree</span>
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </header>
        {/* control panel placeholder */}
        <ControlPanel tableRef={tableRef} />
        {/* trees table placeholder */}
        <TreePageTableWidget
          onRowClick={(event, tree) => {
            event.stopPropagation();
            setCurrentTree(tree);
          }}
          onTableReady={(table) => {
            tableRef.current = table;
          }}
          className="w-full max-w-full"
        />
      </div>
    </main>
  );
}
