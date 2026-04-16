"use client";
import TreePageTableWidget from "@/components/TreePageTableWidget";
import ControlPanel from "@/components/ControlPanel";
import { useState } from "react";
import { TreeSchema } from "@/components/data-table/table-widget-defs";
import TreeDetailsPopout from "@/components/TreeDetailsPopout";
import { useRef } from "react";
import { Table } from "@/components/data-table/table/table-types";

export default function Trees() {
  const [currentTree, setCurrentTree] = useState<TreeSchema | null>(null);
  const tableRef = useRef<Table<TreeSchema> | null>(null);

  return (
    <main className="flex-1 min-w-0 bg-[#FBF7EE]" onClick={() => setCurrentTree(null)}>
      <div className="fixed top-3 -right-100 h-auto w-auto z-30 ">
        <TreeDetailsPopout admin={true} tree={currentTree != null ? currentTree : undefined}></TreeDetailsPopout>
      </div>
      <div className="px-6 py-10">
        {/* header */}
        <header className="flex items-center justify-between pt-5">
          <h1 className="flex-1 text-[56px] font-[Constantia] font-semibold leading-none">Trees</h1>
        </header>
        {/* control panel placeholder */}
        <div className="mt-10 rounded-3xl border-2 border-[#CDAA7F] bg-[#EEE0CF] p-3">
          <ControlPanel tableRef={tableRef} />
        </div>
        {/* trees table placeholder */}
        <TreePageTableWidget
          onRowClick={(event, tree) => {
            event.stopPropagation();
            setCurrentTree(tree);
          }}
          onTableReady={(table) => {
            tableRef.current = table;
          }}
          className="mt-8 w-full max-w-full"
        />
      </div>
    </main>
  );
}
