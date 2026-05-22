"use client";

import { Modal, ModalContent, ModalHeader, ModalFooter } from "@/components/modal";
import { AppButton, appButtonClassName } from "@/components/ui/form-controls";
import { dataToCSV, downloadCSV } from "@/lib/csv";
import type { TaskSchemaWithNames } from "@/components/TaskCard";
import { Download, X } from "lucide-react";

interface ExportCSVModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  allTasks: TaskSchemaWithNames[];
  filteredTasks: TaskSchemaWithNames[];
}

const CSV_HEADERS = [
  "id",
  "title",
  "message",
  "assignees",
  "needs_survey",
  "is_complete",
  "created_at",
  "completion_date",
];

function tasksToCSVData(tasks: TaskSchemaWithNames[]): Record<string, unknown>[] {
  return tasks.map((t) => ({
    id: t.id,
    title: t.title ?? "",
    message: t.message ?? "",
    assignees: t.names.join(", "),
    needs_survey: (t.surveys_needed ?? 0) > 0 ? "Yes" : "No",
    is_complete: t.is_complete ? "Yes" : "No",
    created_at: t.created_at ?? "",
    completion_date: t.completion_date ?? "",
  }));
}

export default function ExportCSVModal({ open, onOpenChange, allTasks, filteredTasks }: ExportCSVModalProps) {
  const handleExport = (tasks: TaskSchemaWithNames[]) => {
    const csv = dataToCSV(tasksToCSVData(tasks), CSV_HEADERS);
    downloadCSV(csv, "tasks_export");
    onOpenChange(false);
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent
        className="bg-off-white"
        widthClassName="w-full max-w-sm"
        closeOnOverlayClick={false}
        showCloseButton={false}
      >
        <ModalHeader className="flex flex-col gap-y-4">
          <div className="flex items-center justify-between gap-x-4">
            <h2 className="text-[1.75rem] text-text-dark font-serif font-extrabold">Export Tasks</h2>
            <button
              type="button"
              className={appButtonClassName({ iconOnly: true, variant: "ghost" })}
              onClick={() => onOpenChange(false)}
            >
              <X className="w-5 h-5 text-text-muted" />
            </button>
          </div>
          <div className="bg-border h-px w-full" />
        </ModalHeader>

        <div className="flex flex-col gap-3 py-4">
          <AppButton
            variant="primary"
            icon={<Download className="h-4 w-4" />}
            onClick={() => handleExport(allTasks)}
            className="w-full"
          >
            Export All Tasks ({allTasks.length})
          </AppButton>
          <AppButton
            variant="secondary"
            icon={<Download className="h-4 w-4" />}
            onClick={() => handleExport(filteredTasks)}
            className="w-full"
          >
            Export Filtered Tasks ({filteredTasks.length})
          </AppButton>
        </div>

        <ModalFooter>
          <div className="flex flex-col w-full gap-y-4">
            <div className="bg-border h-px w-full" />
            <div className="flex justify-end gap-x-4">
              <AppButton variant="secondary" onClick={() => onOpenChange(false)}>
                Cancel
              </AppButton>
            </div>
          </div>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
