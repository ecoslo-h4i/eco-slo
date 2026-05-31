"use client";

import { useEffect, useState } from "react";
import { Modal, ModalClose, ModalContent, ModalHeader, ModalDescription, ModalFooter } from "@/components/modal";
import { AppButton, appButtonClassName, TextField, TextAreaField } from "@/components/ui/form-controls";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/dropdown-menu";
import { dropdownContentClassName, dropdownItemClassName, selectTriggerClassName } from "@/components/ui/form-controls";
import Badge from "@/components/badge";
import { Check, CheckCircle2, ChevronDown, ClipboardList, Pencil, Trash2, Undo2, Users, X } from "lucide-react";
import type { TaskSchemaWithNames } from "@/components/TaskCard";
import TaskSurveyForm from "@/components/survey/TaskSurveyForm";
import { createUserLevelClient } from "@/lib/supabase/client";
import { useCurrentMember } from "@/hooks/useCurrentProvider";
import { cn } from "@/lib/utils";

interface MemberOption {
  id: number;
  name: string;
}

interface TaskDetailModalProps {
  task: TaskSchemaWithNames | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
  isAdmin?: boolean;
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function TaskDetailModal({ task, open, onOpenChange, onSaved, isAdmin }: TaskDetailModalProps) {
  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      {open && (
        <TaskDetailModalContent
          key={task?.id ?? "new"}
          task={task}
          onOpenChange={onOpenChange}
          onSaved={onSaved}
          isAdmin={isAdmin}
        />
      )}
    </Modal>
  );
}

function TaskDetailModalContent({ task, onOpenChange, onSaved, isAdmin }: Omit<TaskDetailModalProps, "open">) {
  const { member } = useCurrentMember();

  const isAddingTask = task === null;

  const [isEditing, setIsEditing] = useState(isAddingTask);
  const [editTitle, setEditTitle] = useState(task?.title ?? "");
  const [editMessage, setEditMessage] = useState(task?.message ?? "");
  const [editAssignees, setEditAssignees] = useState<number[]>(task?.assignees ?? []);
  const [editSurveysNeeded, setEditSurveysNeeded] = useState(task?.surveys_needed ?? 0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [completing, setCompleting] = useState(false);
  const [showSurvey, setShowSurvey] = useState(false);

  const [members, setMembers] = useState<MemberOption[]>([]);

  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAdmin) return;
    const supabase = createUserLevelClient();
    (async () => {
      const { data } = await supabase
        .from("public_members")
        .select("id, firstname, lastname")
        .order("firstname", { ascending: true });
      if (data) {
        setMembers(data.map((m) => ({ id: m.id, name: `${m.firstname} ${m.lastname}` })));
      }
    })();
  }, [isAdmin]);

  const isComplete = !isAddingTask && Boolean(task.is_complete);
  const needsSurvey = !isAddingTask && (task.surveys_needed ?? 0) > 0;
  const isGroup = !isAddingTask && (task.assignees?.length ?? 0) > 1;

  const displayedTitle = isAddingTask ? "Add Task" : task.title || "Task";

  const hasFormChanges = isAddingTask
    ? editTitle.trim().length > 0
    : editTitle !== (task.title ?? "") ||
      editMessage !== (task.message ?? "") ||
      JSON.stringify(editAssignees) !== JSON.stringify(task.assignees ?? []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!hasFormChanges) return;

    if (!editTitle.trim()) {
      setError("Title is required.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const url = isAddingTask ? "/api/admin/tasks" : `/api/admin/tasks/${task.id}`;
      const method = isAddingTask ? "POST" : "PUT";
      const payload = isAddingTask
        ? {
            title: editTitle.trim(),
            message: editMessage.trim(),
            assignees: editAssignees,
            is_complete: false,
            completion_date: null,
            surveys_needed: editSurveysNeeded,
            created_by: member?.id ?? null,
          }
        : {
            title: editTitle.trim(),
            message: editMessage.trim(),
            assignees: editAssignees,
          };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.message || `Failed to ${isAddingTask ? "create" : "update"} task`);
        return;
      }
      setIsEditing(false);
      onSaved();
      onOpenChange(false);
    } catch {
      setError(`Failed to ${isAddingTask ? "create" : "update"} task. Check your connection.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleComplete = async () => {
    if (isAddingTask) return;

    if (needsSurvey) {
      setShowSurvey(true);
      return;
    }

    setCompleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/tasks/${task.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_complete: true, completion_date: new Date().toISOString() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.message || "Failed to complete task");
        return;
      }
      onSaved();
      onOpenChange(false);
    } catch {
      setError("Failed to complete task. Check your connection.");
    } finally {
      setCompleting(false);
    }
  };

  const handleDelete = async () => {
    if (isAddingTask) return;

    setIsDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/admin/tasks/${task.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setDeleteError(data.message || "Failed to delete task");
        return;
      }
      setDeleteConfirmationOpen(false);
      onSaved();
      onOpenChange(false);
    } catch {
      setDeleteError("Failed to delete task. Check your connection.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSurveyCompleted = () => {
    onSaved();
    onOpenChange(false);
    setShowSurvey(false);
  };

  const handleClose = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
    if (!nextOpen) {
      setShowSurvey(false);
      setIsEditing(false);
      setError(null);
    }
  };

  const toggleAssignee = (id: number) => {
    setEditAssignees((prev) => (prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]));
  };

  const selectedSet = new Set(editAssignees);
  const assigneeTriggerText =
    editAssignees.length === 0
      ? "Select assignees…"
      : editAssignees.length <= 2
        ? members
            .filter((m) => selectedSet.has(m.id))
            .map((m) => m.name)
            .join(", ")
        : `${editAssignees.length} selected`;

  return (
    <>
      <ModalContent
        className="bg-off-white"
        widthClassName="w-full max-w-2xl"
        closeOnOverlayClick={false}
        showCloseButton={false}
      >
        <ModalHeader className="flex flex-col gap-y-4">
          <div className="flex items-center justify-between gap-x-4">
            <h2 className="text-[1.75rem] text-text-dark font-serif font-extrabold">{displayedTitle}</h2>
            <div className="flex gap-x-2">
              {isAdmin && !isAddingTask ? (
                <>
                  <button
                    type="button"
                    className={appButtonClassName({ iconOnly: true, variant: "ghost" })}
                    onClick={(event) => {
                      event.stopPropagation();
                      setIsEditing((current) => !current);
                    }}
                  >
                    {isEditing ? (
                      <Undo2 className="w-5 h-5 text-text-muted" />
                    ) : (
                      <Pencil className="w-5 h-5 text-text-muted" />
                    )}
                  </button>
                  <button
                    type="button"
                    className={appButtonClassName({ iconOnly: true, variant: "ghost" })}
                    onClick={(event) => {
                      event.stopPropagation();
                      setDeleteError(null);
                      setDeleteConfirmationOpen(true);
                    }}
                  >
                    <Trash2 className="w-5 h-5 text-destructive" />
                  </button>
                </>
              ) : null}
              <ModalClose asChild>
                <button
                  type="button"
                  className={appButtonClassName({ iconOnly: true, variant: "ghost" })}
                  onClick={(event) => {
                    event.stopPropagation();
                    onOpenChange(false);
                  }}
                >
                  <X className="w-5 h-5 text-text-muted" />
                </button>
              </ModalClose>
            </div>
          </div>
          <div className="bg-border h-px w-full" />
        </ModalHeader>

        {showSurvey && !isAddingTask ? (
          <ModalDescription className="flex flex-col gap-y-4 py-4 overflow-y-auto max-h-[70vh]">
            <div className="bg-foreground p-6 border border-border rounded-xl">
              <TaskSurveyForm
                taskId={task.id}
                taskType={task.type}
                onSurveySubmitted={onSaved}
                onCompleted={handleSurveyCompleted}
              />
            </div>
          </ModalDescription>
        ) : (
          <form onSubmit={handleSubmit}>
            <ModalDescription className="flex flex-col gap-y-4 py-4 overflow-y-auto max-h-[70vh]">
              <div className="bg-foreground p-4 border border-border rounded-xl">
                <p className="text-lg font-serif font-bold text-text-dark pb-2">
                  {isAddingTask ? "Task Information" : "Details"}
                </p>
                <div className="flex flex-col gap-y-4">
                  {isEditing ? (
                    <>
                      <div className="flex flex-col items-start gap-y-1">
                        <p className="text-text-muted font-semibold">
                          <span>Title</span>
                          <span className="text-destructive font-semibold"> *</span>
                        </p>
                        <TextField
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          placeholder="Task title…"
                          disabled={isSubmitting}
                          required
                          className="bg-button-muted"
                        />
                      </div>

                      <div className="flex flex-col items-start gap-y-1">
                        <p className="text-text-muted font-semibold">
                          <span>Message</span>
                        </p>
                        <TextAreaField
                          value={editMessage}
                          onChange={(e) => setEditMessage(e.target.value)}
                          placeholder="Task details…"
                          rows={4}
                          disabled={isSubmitting}
                          className="bg-button-muted"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      {task?.message ? (
                        <div className="flex flex-col items-start gap-y-1">
                          <p className="text-text-muted font-semibold">Message</p>
                          <p className="text-text-dark font-medium whitespace-pre-wrap">{task.message}</p>
                        </div>
                      ) : null}
                    </>
                  )}
                </div>
              </div>

              <div className="bg-foreground p-4 border border-border rounded-xl">
                <p className="text-lg font-serif font-bold text-text-dark pb-2">Assignment</p>
                <div className="flex flex-col gap-y-4">
                  {isEditing ? (
                    <>
                      <div className="flex flex-col items-start gap-y-1">
                        <p className="text-text-muted font-semibold">Assignees</p>
                        <AssigneeSelect
                          members={members}
                          selectedIds={editAssignees}
                          onToggle={toggleAssignee}
                          onClear={() => setEditAssignees([])}
                          triggerText={assigneeTriggerText}
                          disabled={isSubmitting}
                        />
                      </div>

                      {isAddingTask ? (
                        <div className="flex flex-col items-start gap-y-1">
                          <p className="text-text-muted font-semibold">Surveys Needed</p>
                          <TextField
                            type="number"
                            min={0}
                            max={10}
                            value={String(editSurveysNeeded)}
                            onChange={(e) =>
                              setEditSurveysNeeded(Math.min(10, Math.max(0, Number(e.target.value) || 0)))
                            }
                            disabled={isSubmitting}
                            className="max-w-32 bg-button-muted"
                          />
                        </div>
                      ) : null}
                    </>
                  ) : (
                    <>
                      <div className="flex flex-col items-start gap-y-1">
                        <p className="text-text-muted font-semibold">Assignees</p>
                        <p className="text-text-dark font-medium">
                          {task && task.names.length > 0 ? (
                            task.names.join(", ")
                          ) : (
                            <span className="text-text-muted">Unassigned</span>
                          )}
                        </p>
                      </div>

                      <div className="flex flex-col items-start gap-y-1">
                        <p className="text-text-muted font-semibold">Status</p>
                        <div className="flex flex-wrap gap-2">
                          {isComplete ? (
                            <Badge variant="success" icon={<CheckCircle2 className="h-3.5 w-3.5" />}>
                              Complete
                            </Badge>
                          ) : (
                            <Badge variant="muted">Open</Badge>
                          )}
                          {needsSurvey ? (
                            <Badge variant="default" icon={<ClipboardList className="h-3.5 w-3.5" />}>
                              Needs Survey
                            </Badge>
                          ) : (
                            <Badge variant="muted">No Survey Required</Badge>
                          )}
                          {isGroup ? (
                            <Badge variant="info" icon={<Users className="h-3.5 w-3.5" />}>
                              Group Task
                            </Badge>
                          ) : null}
                        </div>
                      </div>

                      {isGroup ? (
                        <p className="text-sm text-text-muted italic">
                          This is a shared task. Completing it marks it done for all assignees.
                        </p>
                      ) : null}

                      <div className="flex gap-x-4">
                        <div className="flex-1 flex flex-col items-start gap-y-1">
                          <p className="text-text-muted font-semibold">Created</p>
                          <p className="text-text-dark font-medium">{formatDate(task?.created_at)}</p>
                        </div>
                        {isComplete && task?.completion_date ? (
                          <div className="flex-1 flex flex-col items-start gap-y-1">
                            <p className="text-text-muted font-semibold">Completed</p>
                            <p className="text-text-dark font-medium">{formatDate(task.completion_date)}</p>
                          </div>
                        ) : null}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {error ? (
                <p className="text-destructive font-medium" role="alert">
                  {error}
                </p>
              ) : null}
            </ModalDescription>

            <ModalFooter>
              <div className="flex flex-col w-full gap-y-4">
                <div className="bg-border h-px w-full" />
                <div className="flex justify-end gap-x-4">
                  <AppButton
                    type="button"
                    variant="secondary"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleClose(false);
                    }}
                  >
                    Cancel
                  </AppButton>
                  {isEditing ? (
                    <AppButton disabled={isSubmitting || !hasFormChanges} type="submit">
                      {isSubmitting
                        ? isAddingTask
                          ? "Creating…"
                          : "Saving…"
                        : isAddingTask
                          ? "Create Task"
                          : "Save Changes"}
                    </AppButton>
                  ) : !isComplete ? (
                    <AppButton type="button" variant="primary" onClick={handleComplete} disabled={completing}>
                      {completing ? "Completing…" : needsSurvey ? "Complete Survey" : "Mark Complete"}
                    </AppButton>
                  ) : null}
                </div>
              </div>
            </ModalFooter>
          </form>
        )}
      </ModalContent>

      {!isAddingTask ? (
        <Modal open={deleteConfirmationOpen} onOpenChange={setDeleteConfirmationOpen}>
          <ModalContent className="bg-card" closeOnOverlayClick={false} showCloseButton={false} widthClassName="px-8">
            <ModalHeader>
              <div className="flex items-center justify-between gap-x-4">
                <h2 className="w-full text-center text-2xl text-text-dark font-serif font-extrabold">Delete Task</h2>
              </div>
            </ModalHeader>
            <ModalDescription className="flex flex-col gap-y-4 pt-1 pb-4">
              <p className="w-full text-center text-text-muted">This action cannot be undone.</p>
              {deleteError ? <p className="text-destructive font-medium">{deleteError}</p> : null}
            </ModalDescription>
            <ModalFooter>
              <div className="w-full flex justify-center gap-x-4">
                <AppButton type="button" variant="secondary" onClick={() => setDeleteConfirmationOpen(false)}>
                  Cancel
                </AppButton>
                <AppButton variant="danger" disabled={isDeleting} onClick={handleDelete} type="button">
                  {isDeleting ? "Deleting…" : "Delete Task"}
                </AppButton>
              </div>
            </ModalFooter>
          </ModalContent>
        </Modal>
      ) : null}
    </>
  );
}

function AssigneeSelect({
  members,
  selectedIds,
  onToggle,
  onClear,
  triggerText,
  disabled,
}: {
  members: MemberOption[];
  selectedIds: number[];
  onToggle: (id: number) => void;
  onClear: () => void;
  triggerText: string;
  disabled?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedSet = new Set(selectedIds);

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger className={cn(selectTriggerClassName, "w-full")} disabled={disabled}>
        <span className={cn("truncate", selectedIds.length === 0 && "text-text-muted")}>{triggerText}</span>
        <ChevronDown
          className={`w-4 h-4 text-text-muted transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className={cn(dropdownContentClassName, "max-h-72")}>
        <DropdownMenuCheckboxItem
          className={dropdownItemClassName}
          checked={selectedIds.length === 0}
          checkedIcon={<Check className="h-4 w-4" />}
          onSelect={(e) => e.preventDefault()}
          onCheckedChange={onClear}
        >
          None
        </DropdownMenuCheckboxItem>
        <DropdownMenuSeparator />
        {members.length === 0 ? (
          <DropdownMenuItem className={dropdownItemClassName} disabled>
            No members
          </DropdownMenuItem>
        ) : (
          members.map((m) => (
            <DropdownMenuCheckboxItem
              key={m.id}
              className={dropdownItemClassName}
              checked={selectedSet.has(m.id)}
              checkedIcon={<Check className="h-4 w-4" />}
              onSelect={(e) => e.preventDefault()}
              onCheckedChange={() => onToggle(m.id)}
            >
              {m.name}
            </DropdownMenuCheckboxItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
