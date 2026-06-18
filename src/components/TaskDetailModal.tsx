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
import { TaskMessage } from "@/components/TaskMessage";
import TaskSurveyForm from "@/components/survey/TaskSurveyForm";
import { createUserLevelClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { Enums } from "@/database/database.types";

interface MemberOption {
  id: number;
  name: string;
}

interface TreeOption {
  ecoslo_num: number;
  common_name: string | null;
  species_name: string | null;
  tree_keeper_id: number | null;
}

type SurveyMode = Enums<"TaskSurveyMode">;

const SURVEY_MODE_OPTIONS: { label: string; value: SurveyMode }[] = [
  { label: "No Survey", value: "none" },
  { label: "Optional Survey", value: "optional" },
  { label: "Required Survey", value: "required" },
];

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

function formatTreeLabel(tree: Pick<TreeOption, "ecoslo_num" | "common_name" | "species_name">): string {
  const primary = tree.common_name?.trim() || tree.species_name?.trim() || "Tree";
  return `#${tree.ecoslo_num} - ${primary}`;
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
  const isAddingTask = task === null;

  const [isEditing, setIsEditing] = useState(isAddingTask);
  const [editTitle, setEditTitle] = useState(task?.title ?? "");
  const [editMessage, setEditMessage] = useState(task?.message ?? "");
  const [editAssignees, setEditAssignees] = useState<number[]>(task?.assignees ?? []);
  const [editSurveyMode, setEditSurveyMode] = useState<SurveyMode>(task?.survey_mode ?? "none");
  const [editSurveyRequiredCount, setEditSurveyRequiredCount] = useState(task?.survey_required_count ?? 1);
  const [editTreeTargets, setEditTreeTargets] = useState<number[]>(task?.tree_targets ?? []);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [completing, setCompleting] = useState(false);
  const [showSurvey, setShowSurvey] = useState(false);

  const [members, setMembers] = useState<MemberOption[]>([]);
  const [treeOptions, setTreeOptions] = useState<TreeOption[]>([]);

  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAdmin) return;
    const supabase = createUserLevelClient();
    (async () => {
      const [membersResult, treesResult] = await Promise.all([
        supabase.from("public_members").select("id, firstname, lastname").order("firstname", { ascending: true }),
        supabase.from("trees").select("ecoslo_num, common_name, species_name, tree_keeper_id").order("ecoslo_num"),
      ]);

      if (membersResult.data) {
        setMembers(membersResult.data.map((m) => ({ id: m.id, name: `${m.firstname} ${m.lastname}` })));
      }
      if (treesResult.data) {
        setTreeOptions(treesResult.data);
      }
    })();
  }, [isAdmin]);

  const isComplete = !isAddingTask && Boolean(task.is_complete);
  const taskSurveyMode = !isAddingTask ? task.survey_mode : editSurveyMode;
  const surveysRemaining = !isAddingTask ? (task.surveys_needed ?? 0) : editSurveyRequiredCount;
  const requiredSurveyOutstanding = taskSurveyMode === "required" && surveysRemaining > 0;
  const canSubmitSurvey = !isAddingTask && taskSurveyMode !== "none";
  const isGroup = !isAddingTask && (task.assignees?.length ?? 0) > 1;
  const linkedTrees = !isAddingTask ? (task.tree_targets ?? []) : editTreeTargets;

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
            survey_mode: editSurveyMode,
            survey_required_count: editSurveyMode === "required" ? editSurveyRequiredCount : 0,
            tree_targets: editTreeTargets,
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

    if (requiredSurveyOutstanding) {
      setShowSurvey(true);
      return;
    }

    setCompleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/tasks/${task.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "complete" }),
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

  const handleShowSurvey = () => {
    setError(null);
    setShowSurvey(true);
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
    const next = editAssignees.includes(id) ? editAssignees.filter((a) => a !== id) : [...editAssignees, id];
    const assigneeSet = new Set(next);
    setEditAssignees(next);
    setEditTreeTargets((current) =>
      current.filter((target) => {
        const tree = treeOptions.find((option) => option.ecoslo_num === target);
        return tree ? assigneeSet.has(tree.tree_keeper_id ?? -1) : false;
      }),
    );
  };

  const toggleTreeTarget = (ecosloNum: number) => {
    setEditTreeTargets((prev) => {
      const next = prev.includes(ecosloNum)
        ? prev.filter((target) => target !== ecosloNum)
        : [...prev, ecosloNum].sort((a, b) => a - b);

      if (editSurveyMode === "required") {
        setEditSurveyRequiredCount(Math.max(1, next.length || 1));
      }

      return next;
    });
  };

  const handleSurveyModeChange = (mode: SurveyMode) => {
    setEditSurveyMode(mode);
    if (mode === "required") {
      setEditSurveyRequiredCount(Math.max(1, editTreeTargets.length || editSurveyRequiredCount || 1));
    } else {
      setEditSurveyRequiredCount(0);
    }
  };

  const selectedSet = new Set(editAssignees);
  const editableTreeOptions = treeOptions.filter((tree) => selectedSet.has(tree.tree_keeper_id ?? -1));
  const treeLabelById = new Map(treeOptions.map((tree) => [tree.ecoslo_num, formatTreeLabel(tree)]));
  const assigneeTriggerText =
    editAssignees.length === 0
      ? "Select assignees…"
      : editAssignees.length <= 2
        ? members
            .filter((m) => selectedSet.has(m.id))
            .map((m) => m.name)
            .join(", ")
        : `${editAssignees.length} selected`;
  const treeTriggerText =
    editTreeTargets.length === 0
      ? editAssignees.length === 0
        ? "Select assignees first"
        : "No linked trees"
      : editTreeTargets.length <= 2
        ? editTreeTargets.map((target) => treeLabelById.get(target) ?? `#${target}`).join(", ")
        : `${editTreeTargets.length} linked trees`;

  const surveyBadge =
    taskSurveyMode === "optional"
      ? { label: "Survey Available", variant: "info" as const }
      : taskSurveyMode === "required"
        ? {
            label: surveysRemaining > 0 ? `Survey Required (${surveysRemaining} remaining)` : "Survey Required",
            variant: "default" as const,
          }
        : { label: "No Survey", variant: "muted" as const };

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
              <TaskSurveyForm taskId={task.id} onSurveySubmitted={onSaved} onCompleted={handleSurveyCompleted} />
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
                      {/* Display resolves {message variables}; the edit textarea keeps the raw tokens. */}
                      {task?.message ? (
                        <div className="flex flex-col items-start gap-y-1">
                          <p className="text-text-muted font-semibold">Message</p>
                          <p className="text-text-dark font-medium whitespace-pre-wrap">
                            <TaskMessage segments={task.displaySegments ?? [{ kind: "text", text: task.message }]} />
                          </p>
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
                        <>
                          <div className="flex flex-col items-start gap-y-2">
                            <p className="text-text-muted font-semibold">Linked Trees</p>
                            <TreeTargetSelect
                              options={editableTreeOptions}
                              selectedIds={editTreeTargets}
                              onToggle={toggleTreeTarget}
                              onClear={() => {
                                setEditTreeTargets([]);
                                if (editSurveyMode === "required") {
                                  setEditSurveyRequiredCount((current) => Math.min(10, Math.max(1, current)));
                                }
                              }}
                              triggerText={treeTriggerText}
                              disabled={isSubmitting || editAssignees.length === 0}
                            />
                          </div>

                          <div className="flex flex-col items-start gap-y-2">
                            <p className="text-text-muted font-semibold">Survey Mode</p>
                            <div className="flex flex-wrap gap-2">
                              {SURVEY_MODE_OPTIONS.map((option) => {
                                const active = editSurveyMode === option.value;
                                return (
                                  <button
                                    key={option.value}
                                    type="button"
                                    disabled={isSubmitting}
                                    className={cn(
                                      "min-h-9 rounded-lg border px-3 py-2 text-sm font-semibold transition-colors",
                                      active
                                        ? "border-primary bg-primary text-on-primary"
                                        : "border-border bg-button-muted text-text hover:bg-off-white-2",
                                    )}
                                    onClick={() => handleSurveyModeChange(option.value)}
                                  >
                                    {option.label}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {editSurveyMode === "required" ? (
                            <div className="flex flex-col items-start gap-y-1">
                              <p className="text-text-muted font-semibold">Required Surveys</p>
                              <TextField
                                type="number"
                                min={1}
                                max={editTreeTargets.length > 0 ? editTreeTargets.length : 10}
                                value={String(editSurveyRequiredCount)}
                                onChange={(e) => {
                                  const max = editTreeTargets.length > 0 ? editTreeTargets.length : 10;
                                  setEditSurveyRequiredCount(Math.min(max, Math.max(1, Number(e.target.value) || 1)));
                                }}
                                disabled={isSubmitting}
                                className="max-w-32 bg-button-muted"
                              />
                            </div>
                          ) : null}
                        </>
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
                          <Badge variant={surveyBadge.variant} icon={<ClipboardList className="h-3.5 w-3.5" />}>
                            {surveyBadge.label}
                          </Badge>
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

                      {linkedTrees.length > 0 ? (
                        <div className="flex flex-col items-start gap-y-1">
                          <p className="text-text-muted font-semibold">Linked Trees</p>
                          <p className="text-text-dark font-medium">
                            {linkedTrees.map((target) => treeLabelById.get(target) ?? `#${target}`).join(", ")}
                          </p>
                        </div>
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
                  ) : (
                    <>
                      {canSubmitSurvey && (isComplete || taskSurveyMode === "optional") ? (
                        <AppButton
                          type="button"
                          variant={isComplete ? "primary" : "secondary"}
                          onClick={handleShowSurvey}
                        >
                          {isComplete ? "Submit Additional Survey" : "Submit Survey"}
                        </AppButton>
                      ) : null}
                      {!isComplete ? (
                        <AppButton type="button" variant="primary" onClick={handleComplete} disabled={completing}>
                          {completing
                            ? "Completing…"
                            : requiredSurveyOutstanding
                              ? "Complete Required Survey"
                              : "Mark Complete"}
                        </AppButton>
                      ) : null}
                    </>
                  )}
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

function TreeTargetSelect({
  options,
  selectedIds,
  onToggle,
  onClear,
  triggerText,
  disabled,
}: {
  options: TreeOption[];
  selectedIds: number[];
  onToggle: (ecosloNum: number) => void;
  onClear: () => void;
  triggerText: string;
  disabled?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedSet = new Set(selectedIds);

  return (
    <DropdownMenu open={!disabled && isOpen} onOpenChange={disabled ? undefined : setIsOpen}>
      <DropdownMenuTrigger className={cn(selectTriggerClassName, "w-full")} disabled={disabled}>
        <span className={cn("truncate", selectedIds.length === 0 && "text-text-muted")}>{triggerText}</span>
        {!disabled ? (
          <ChevronDown
            className={`w-4 h-4 text-text-muted transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          />
        ) : null}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className={cn(dropdownContentClassName, "max-h-72")}>
        <DropdownMenuCheckboxItem
          className={dropdownItemClassName}
          checked={selectedIds.length === 0}
          checkedIcon={<Check className="h-4 w-4" />}
          onSelect={(e) => e.preventDefault()}
          onCheckedChange={onClear}
        >
          No linked trees
        </DropdownMenuCheckboxItem>
        <DropdownMenuSeparator />
        {options.length === 0 ? (
          <DropdownMenuItem className={dropdownItemClassName} disabled>
            No trees for selected assignees
          </DropdownMenuItem>
        ) : (
          options.map((tree) => (
            <DropdownMenuCheckboxItem
              key={tree.ecoslo_num}
              className={dropdownItemClassName}
              checked={selectedSet.has(tree.ecoslo_num)}
              checkedIcon={<Check className="h-4 w-4" />}
              onSelect={(e) => e.preventDefault()}
              onCheckedChange={() => onToggle(tree.ecoslo_num)}
            >
              {formatTreeLabel(tree)}
            </DropdownMenuCheckboxItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
