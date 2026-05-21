"use client";

import { MemberSchema } from "@/components/data-table/table-widget-defs";
import MemberPageTableWidget from "@/components/MemberPageTableWidget";
import { Download, Plus } from "lucide-react";
import { useRef, useState } from "react";
import { Table } from "@/components/data-table/table/table-types";
import MembersControlPanel from "@/components/MembersControlPanel";
import VolunteerPageForm from "@/components/volunteer-page-form";
import { AppButton } from "@/components/ui/form-controls";
import { AdminPageShell } from "@/components/admin-page-shell";
import { downloadMemberCSV, dataToCSV } from "./utils/csv";

export default function Volunteers() {
  const tableRef = useRef<Table<MemberSchema> | null>(null);
  const refetchRef = useRef<(() => void) | null>(null);
  const [memberModalOpen, setMemberModalOpen] = useState(false);
  const [modalMember, setModalMember] = useState<MemberSchema | null>(null);

  const handleAddVolunteerClick = () => {
    setModalMember(null);
    setMemberModalOpen(true);
  };

  const handleModalOpenChange = (open: boolean) => {
    setMemberModalOpen(open);
    if (!open) setModalMember(null);
  };

  return (
    <AdminPageShell
      title="Members"
      actions={
        <>
          <AppButton
            variant="secondary"
            size="md"
            radius="small"
            icon={Download}
            onClick={() => {
              downloadMemberCSV(
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
          <AppButton radius="small" icon={Plus} onClick={handleAddVolunteerClick} type="button">
            Add Member
          </AppButton>
        </>
      }
    >
      <MembersControlPanel tableRef={tableRef} />

      <MemberPageTableWidget
        refetchRef={refetchRef}
        onRowClick={(e, member) => {
          e.stopPropagation();
          setModalMember(member);
          setMemberModalOpen(true);
        }}
        onTableReady={(table) => {
          tableRef.current = table;
        }}
        className="w-full max-w-full"
      />
      <VolunteerPageForm
        member={modalMember}
        onOpenChange={handleModalOpenChange}
        onSaved={() => refetchRef.current?.()}
        open={memberModalOpen}
      />
    </AdminPageShell>
  );
}
