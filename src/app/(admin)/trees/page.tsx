"use client";
import TreePageTableWidget from "@/components/TreePageTableWidget";
import ControlPanel from "@/components/ControlPanel";
import { useCallback, useRef, useState } from "react";
import { TreeSchema } from "@/components/data-table/table-widget-defs";
import TreeDetailModal from "@/components/tree-detail-modal";
import { Table } from "@/components/data-table/table/table-types";
import { Download, Plus } from "lucide-react";
import { downloadTreeCSV, dataToCSV } from "./utils/csv";
import { AppButton } from "@/components/ui/form-controls";
import { AdminPageShell } from "@/components/admin-page-shell";

export default function Trees() {
  const tableRef = useRef<Table<TreeSchema> | null>(null);
  const refetchRef = useRef<(() => void) | null>(null);
  const [treeModalOpen, setTreeModalOpen] = useState(false);
  const [modalTree, setModalTree] = useState<TreeSchema | null>(null);
  const [tableVersion, setTableVersion] = useState(0);

  const handleTableReady = useCallback((table: Table<TreeSchema>) => {
    tableRef.current = table;
    setTableVersion((v) => v + 1);
  }, []);

  const handleAddTreeClick = () => {
    setModalTree(null);
    setTreeModalOpen(true);
  };

  const handleModalOpenChange = (open: boolean) => {
    setTreeModalOpen(open);
    if (!open) setModalTree(null);
  };

  return (
    <AdminPageShell
      title="Trees"
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
          <AppButton radius="small" icon={Plus} onClick={handleAddTreeClick}>
            Add Tree
          </AppButton>
        </>
      }
    >
      <ControlPanel tableRef={tableRef} tableVersion={tableVersion} />
      <TreePageTableWidget
        refetchRef={refetchRef}
        onRowClick={(event, tree) => {
          event.stopPropagation();
          setModalTree(tree);
          setTreeModalOpen(true);
        }}
        onTableReady={handleTableReady}
        className="w-full max-w-full"
      />
      <TreeDetailModal
        tree={modalTree}
        open={treeModalOpen}
        onOpenChange={handleModalOpenChange}
        onSaved={() => refetchRef.current?.()}
      />
    </AdminPageShell>
  );
}
