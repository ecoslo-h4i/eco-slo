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
import { AppButton } from "@/components/ui/form-controls";
import { AdminPageShell } from "@/components/admin-page-shell";

export default function Trees() {
  const [currentTree, setCurrentTree] = useState<TreeSchema | null>(null);
  const tableRef = useRef<Table<TreeSchema> | null>(null);

  return (
    <AdminPageShell
      title="Trees"
      onClick={() => setCurrentTree(null)}
      beforeContent={
        <div className="fixed top-3 -right-100 h-auto w-auto z-30 ">
          <TreeDetailsPopout
            key={currentTree != null ? String(currentTree.id) : "closed"}
            admin={true}
            tree={currentTree != null ? currentTree : undefined}
            onClose={() => setCurrentTree(null)}
          />
        </div>
      }
      actions={
        <>
          <AppButton
            variant="secondary"
            size="md"
            radius="small"
            icon={Download}
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
            Export CSV
          </AppButton>
          <AppButton radius="small" icon={Plus}>
            Add Tree
          </AppButton>
        </>
      }
    >
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
    </AdminPageShell>
  );
}
