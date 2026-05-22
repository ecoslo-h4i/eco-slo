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
import { useCurrentMember } from "@/hooks/useCurrentProvider";

export default function Trees() {
  const { isAdmin } = useCurrentMember();
  const tableRef = useRef<Table<TreeSchema> | null>(null);
  const refetchRef = useRef<(() => void) | null>(null);
  const [treeModalOpen, setTreeModalOpen] = useState(false);
  const [modalTree, setModalTree] = useState<TreeSchema | null>(null);

  const handleTableReady = useCallback((table: Table<TreeSchema>) => {
    tableRef.current = table;
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
          {isAdmin && (
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
          )}
          {isAdmin && (
            <AppButton radius="small" icon={Plus} onClick={handleAddTreeClick}>
              Add Tree
            </AppButton>
          )}
        </>
      }
    >
      <ControlPanel tableRef={tableRef} />
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
        isAdmin={isAdmin}
      />
    </AdminPageShell>
  );
}
