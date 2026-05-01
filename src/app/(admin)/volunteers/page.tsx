"use client";

import { MemberSchema } from "@/components/data-table/table-widget-defs";
import MemberPageTableWidget from "@/components/MemberPageTableWidget";
import { Plus } from "lucide-react";
import { useRef } from "react";
import { Table } from "@/components/data-table/table/table-types";
import MembersControlPanel from "@/components/MembersControlPanel";

export default function Volunteers() {
  const tableRef = useRef<Table<MemberSchema> | null>(null);

  return (
    <main className="flex-1 min-w-0 bg-background">
      <div className="flex flex-col gap-y-8 px-6 py-10">
        <header className="w-full flex items-center justify-between pb-2">
          <h1 className="text-5xl font-[Constantia] font-semibold leading-none">Volunteers</h1>
          <button className="flex items-center gap-x-2 px-4 py-2 bg-primary text-text-light border border-border text-text-dark rounded-full hover:bg-primary/90 transition-colors duration-100">
            <span className="font-medium">Add Volunteer</span>
            <Plus className="w-4 h-4" />
          </button>
        </header>

        <MembersControlPanel tableRef={tableRef} />

        <MemberPageTableWidget
          onRowClick={(event, tree) => {
            event.stopPropagation();
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
