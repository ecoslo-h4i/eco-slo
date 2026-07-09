"use client";

import Badge from "@/components/badge";
import { formatDateTime, SurveySchema } from "@/components/data-table/table-widget-defs";
import { Modal, ModalClose, ModalContent, ModalDescription, ModalFooter, ModalHeader } from "@/components/modal";
import {
  AppButton,
  appButtonClassName,
  SelectField,
  type SelectOption,
  TextAreaField,
  TextField,
} from "@/components/ui/form-controls";
import { createUserLevelClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { buildSurveyFields, SURVEY_ISSUE_OPTIONS, surveyIssueLabel, type SurveyIssueValue } from "@/types/survey";
import { Pencil, Trash2, Undo2, X } from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";

const DEFAULT_ISSUE: SurveyIssueValue = "watering";

type TreeOption = {
  ecoslo_num: number;
  common_name: string | null;
  species_name: string | null;
};

function treeOptionLabel(tree: TreeOption): string {
  const primary = tree.common_name?.trim() || tree.species_name?.trim() || "Tree";
  return `#${tree.ecoslo_num} — ${primary}`;
}

function isValidOptionalHttpUrl(s: string): boolean {
  const t = s.trim();
  if (!t) return true;
  try {
    const u = new URL(t);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

const choiceClass =
  "flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 transition hover:bg-off-white has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary/40";

type SurveyDetailModalProps = {
  survey: SurveySchema | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
  isAdmin: boolean;
};

export default function SurveyDetailModal({ survey, open, onOpenChange, onSaved, isAdmin }: SurveyDetailModalProps) {
  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      {open && (
        <SurveyDetailModalContent
          key={survey?.id ?? "new"}
          survey={survey}
          onOpenChange={onOpenChange}
          onSaved={onSaved}
          isAdmin={isAdmin}
        />
      )}
    </Modal>
  );
}

function SurveyDetailModalContent({ survey, onOpenChange, onSaved, isAdmin }: Omit<SurveyDetailModalProps, "open">) {
  const isAddingSurvey = survey === null;
  // Editing and deleting existing surveys is admin-only; adding is open to
  // Tree Keepers too (they may link one of their own trees).
  const canEdit = isAdmin && !isAddingSurvey;
  const [isEditing, setIsEditing] = useState(isAddingSurvey);

  const [treeEcoslo, setTreeEcoslo] = useState(survey?.tree != null ? String(survey.tree) : "");
  const [issue, setIssueState] = useState<SurveyIssueValue>(survey?.issue ?? DEFAULT_ISSUE);
  const [issueOther, setIssueOther] = useState(survey?.issue_other ?? "");
  const [imageLink, setImageLink] = useState(survey?.image_link ?? "");
  const [notes, setNotes] = useState(survey?.notes ?? "");
  const [adminContact, setAdminContact] = useState(survey?.admin_contact ?? false);

  const [treeOptions, setTreeOptions] = useState<TreeOption[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Load the tree selector options while editing. RLS scopes the list: admins
  // see every tree, Tree Keepers only their own — exactly the set each role
  // may link a survey to.
  useEffect(() => {
    if (!isEditing) return;

    let cancelled = false;

    (async () => {
      const supabase = createUserLevelClient();
      const { data } = await supabase.from("trees").select("ecoslo_num, common_name, species_name").order("ecoslo_num");
      if (!cancelled && data) setTreeOptions(data);
    })();

    return () => {
      cancelled = true;
    };
  }, [isEditing]);

  const treeSelectOptions: SelectOption[] = [
    ...(isAdmin ? [{ label: "No linked tree", value: "" }] : []),
    ...treeOptions.map((tree) => ({ label: treeOptionLabel(tree), value: String(tree.ecoslo_num) })),
  ];

  const displayedTitle = isAddingSurvey ? "Add Survey" : `Survey #${survey.id}`;

  const initialForm = {
    tree: survey?.tree != null ? String(survey.tree) : "",
    issue: survey?.issue ?? DEFAULT_ISSUE,
    issueOther: survey?.issue_other ?? "",
    imageLink: survey?.image_link ?? "",
    notes: survey?.notes ?? "",
    adminContact: survey?.admin_contact ?? false,
  };
  const hasFormChanges =
    isAddingSurvey ||
    treeEcoslo !== initialForm.tree ||
    issue !== initialForm.issue ||
    issueOther.trim() !== initialForm.issueOther ||
    imageLink.trim() !== initialForm.imageLink ||
    notes.trim() !== initialForm.notes ||
    adminContact !== initialForm.adminContact;

  const clearFieldError = (key: string) => {
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const setIssue = (value: SurveyIssueValue) => {
    setIssueState(value);
    if (value !== "other") clearFieldError("issueOther");
  };

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!isAdmin && !treeEcoslo) {
      next.tree = "Select one of your trees.";
    }
    if (issue === "other" && !issueOther.trim()) {
      next.issueOther = 'Add a description when "Other" is selected.';
    }
    if (!isValidOptionalHttpUrl(imageLink)) {
      next.imageLink = "Enter a valid http(s) URL or leave this blank.";
    }
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isEditing || !hasFormChanges) return;
    if (!validate()) return;

    setIsSubmitting(true);
    setFormError(null);

    const payload = {
      tree: treeEcoslo ? Number(treeEcoslo) : null,
      ...buildSurveyFields({ issue, issueOther, imageLink, adminContact, notes }),
    };

    try {
      const response = await fetch(isAddingSurvey ? "/api/admin/surveys" : `/api/admin/surveys/${survey.id}`, {
        method: isAddingSurvey ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = (await response.json().catch(() => null)) as { message?: unknown } | null;

      if (!response.ok) {
        throw new Error(typeof body?.message === "string" ? body.message : "Failed to save survey");
      }

      onSaved();
      onOpenChange(false);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Failed to save survey");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (isAddingSurvey) return;

    setIsDeleting(true);
    setDeleteError(null);

    try {
      const response = await fetch(`/api/admin/surveys/${survey.id}`, { method: "DELETE" });
      const body = (await response.json().catch(() => null)) as { message?: unknown } | null;

      if (!response.ok) {
        throw new Error(typeof body?.message === "string" ? body.message : "Failed to delete survey");
      }

      setDeleteConfirmationOpen(false);
      onSaved();
      onOpenChange(false);
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : "Failed to delete survey");
    } finally {
      setIsDeleting(false);
    }
  };

  const taskDisplay = survey?.task == null ? null : survey.task_title || `Task #${survey.task}`;

  return (
    <>
      <ModalContent
        className="bg-off-white"
        closeOnOverlayClick={false}
        showCloseButton={false}
        widthClassName="w-full max-w-xl"
      >
        <form onSubmit={handleSubmit}>
          <ModalHeader className="flex flex-col gap-y-4">
            <div className="flex items-center justify-between gap-x-4">
              <div className="flex gap-x-4 items-center">
                <h2 className="text-[1.75rem] text-text-dark font-serif font-extrabold">{displayedTitle}</h2>
              </div>
              <div className="flex gap-x-2">
                {canEdit && (
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
                )}
                {canEdit && (
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
                )}
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

          <ModalDescription className="flex flex-col gap-y-4 py-4 overflow-y-auto max-h-[60dvh] md:max-h-[70vh]">
            {isEditing ? (
              /* Editable survey fields (add + admin edit). */
              <div className="bg-foreground p-4 border border-border rounded-xl">
                <p className="text-lg font-serif font-bold text-text-dark pb-2">Survey Details</p>
                <div className="flex flex-col gap-y-4">
                  <div className="flex flex-col items-start gap-y-1">
                    <p className="text-text-muted font-semibold">
                      <span>Linked Tree</span>
                      {!isAdmin && <span className="text-destructive font-semibold"> *</span>}
                    </p>
                    <SelectField
                      value={treeEcoslo}
                      onChange={(value) => {
                        setTreeEcoslo(value);
                        clearFieldError("tree");
                      }}
                      disabled={isSubmitting}
                      placeholder={isAdmin ? "No linked tree" : "Select one of your trees..."}
                      className={cn("bg-button-muted", fieldErrors.tree && "border-danger")}
                      options={treeSelectOptions}
                    />
                    {fieldErrors.tree ? <p className="text-sm text-danger">{fieldErrors.tree}</p> : null}
                    {!isAdmin && treeOptions.length === 0 ? (
                      <p className="text-sm text-text-muted">No trees are assigned to you.</p>
                    ) : null}
                  </div>

                  {taskDisplay ? (
                    <div className="flex flex-col items-start gap-y-1">
                      <p className="text-text-muted font-semibold">Task</p>
                      <p className="text-text-dark font-medium">{taskDisplay}</p>
                    </div>
                  ) : null}

                  <div className="flex flex-col items-start gap-y-1">
                    <p className="text-text-muted font-semibold">
                      <span>Issue Type</span>
                      <span className="text-destructive font-semibold"> *</span>
                    </p>
                    <SelectField
                      value={issue}
                      onChange={(value) => setIssue(value as SurveyIssueValue)}
                      disabled={isSubmitting}
                      required
                      className="bg-button-muted"
                      options={SURVEY_ISSUE_OPTIONS.map((option) => ({ label: option.label, value: option.value }))}
                    />
                  </div>

                  {issue === "other" ? (
                    <div className="flex flex-col items-start gap-y-1">
                      <p className="text-text-muted font-semibold">
                        <span>Describe (other)</span>
                        <span className="text-destructive font-semibold"> *</span>
                      </p>
                      <TextAreaField
                        value={issueOther}
                        onChange={(e) => setIssueOther(e.target.value)}
                        disabled={isSubmitting}
                        placeholder="Describe the issue…"
                        required
                        rows={3}
                        className={cn("bg-button-muted", fieldErrors.issueOther && "border-danger")}
                      />
                      {fieldErrors.issueOther ? <p className="text-sm text-danger">{fieldErrors.issueOther}</p> : null}
                    </div>
                  ) : null}

                  <div className="flex flex-col items-start gap-y-1">
                    <p className="text-text-muted font-semibold">Image Link (optional)</p>
                    <TextField
                      type="url"
                      inputMode="url"
                      autoComplete="off"
                      value={imageLink}
                      onChange={(e) => setImageLink(e.target.value)}
                      disabled={isSubmitting}
                      placeholder="https://…"
                      className={cn("bg-button-muted", fieldErrors.imageLink && "border-danger")}
                    />
                    {fieldErrors.imageLink ? <p className="text-sm text-danger">{fieldErrors.imageLink}</p> : null}
                  </div>

                  <div className="flex flex-col items-start gap-y-1">
                    <p className="text-text-muted font-semibold">Notes (optional)</p>
                    <TextAreaField
                      rows={3}
                      className="bg-button-muted"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      disabled={isSubmitting}
                      placeholder="Anything else we should know…"
                    />
                  </div>

                  <div className="flex flex-col items-start gap-y-1">
                    <p className="text-text-muted font-semibold">May an administrator contact the submitter?</p>
                    <div className="flex gap-3">
                      <label className={choiceClass}>
                        <input
                          type="radio"
                          name="survey-admin-contact"
                          className="h-4 w-4 accent-primary"
                          checked={adminContact === true}
                          onChange={() => setAdminContact(true)}
                          disabled={isSubmitting}
                        />
                        <span className="text-base text-text font-mulish">Yes</span>
                      </label>
                      <label className={choiceClass}>
                        <input
                          type="radio"
                          name="survey-admin-contact"
                          className="h-4 w-4 accent-primary"
                          checked={adminContact === false}
                          onChange={() => setAdminContact(false)}
                          disabled={isSubmitting}
                        />
                        <span className="text-base text-text font-mulish">No</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Read-only survey view. */
              <>
                <div className="bg-foreground p-4 border border-border rounded-xl">
                  <p className="text-lg font-serif font-bold text-text-dark pb-2">Survey Information</p>
                  <div className="flex flex-col gap-y-4">
                    <div className="flex flex-col gap-4 sm:flex-row">
                      <div className="flex-1 flex flex-col items-start gap-y-1">
                        <p className="text-text-muted font-semibold">Date Submitted</p>
                        <p className="text-text-dark font-medium">{formatDateTime(survey?.created_at)}</p>
                      </div>
                      <div className="flex-1 flex flex-col items-start gap-y-1">
                        <p className="text-text-muted font-semibold">Issue</p>
                        <Badge variant={survey?.issue ? "default" : "muted"}>{surveyIssueLabel(survey?.issue)}</Badge>
                      </div>
                    </div>
                    {survey?.issue_other ? (
                      <div className="flex flex-col items-start gap-y-1">
                        <p className="text-text-muted font-semibold">Description (other)</p>
                        <p className="text-text-dark font-medium whitespace-pre-wrap">{survey.issue_other}</p>
                      </div>
                    ) : null}
                    <div className="flex flex-col gap-4 sm:flex-row">
                      <div className="flex-1 flex flex-col items-start gap-y-1">
                        <p className="text-text-muted font-semibold">Image</p>
                        {survey?.image_link ? (
                          <a
                            href={survey.image_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-primary underline underline-offset-2 hover:text-primary-hover"
                          >
                            View Image
                          </a>
                        ) : (
                          <p className="text-text-muted font-medium">None provided</p>
                        )}
                      </div>
                      <div className="flex-1 flex flex-col items-start gap-y-1">
                        <p className="text-text-muted font-semibold">Contact OK</p>
                        <Badge variant={survey?.admin_contact ? "info" : "muted"}>
                          {survey?.admin_contact ? "Yes" : "No"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-foreground p-4 border border-border rounded-xl">
                  <p className="text-lg font-serif font-bold text-text-dark pb-2">Links</p>
                  <div className="flex flex-col gap-y-4">
                    <div className="flex flex-col items-start gap-y-1">
                      <p className="text-text-muted font-semibold">Linked Tree</p>
                      {survey?.tree_label ? (
                        <p className="text-text-dark font-medium">{survey.tree_label}</p>
                      ) : (
                        <Badge variant="muted">Unlinked</Badge>
                      )}
                    </div>
                    <div className="flex flex-col items-start gap-y-1">
                      <p className="text-text-muted font-semibold">Task</p>
                      {taskDisplay ? (
                        <p className="text-text-dark font-medium">{taskDisplay}</p>
                      ) : (
                        <p className="text-text-muted font-medium">No linked task</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-foreground p-4 border border-border rounded-xl">
                  <p className="text-lg font-serif font-bold text-text-dark pb-2">Submitted By</p>
                  {survey?.submitter.name ? (
                    <div className="flex flex-col gap-y-4">
                      <div className="flex flex-col items-start gap-y-1">
                        <p className="text-text-muted font-semibold">Name</p>
                        <p className="text-text-dark font-medium capitalize">{survey.submitter.name}</p>
                      </div>
                      <div className="flex flex-col gap-4 sm:flex-row">
                        <div className="flex-1 flex flex-col items-start gap-y-1">
                          <p className="text-text-muted font-semibold">Email</p>
                          <p className="text-text-dark font-medium">
                            {survey.submitter.email ? (
                              survey.submitter.email
                            ) : (
                              <span className="text-text-muted">None provided</span>
                            )}
                          </p>
                        </div>
                        <div className="flex-1 flex flex-col items-start gap-y-1">
                          <p className="text-text-muted font-semibold">Phone</p>
                          <p className="text-text-dark font-medium">
                            {survey.submitter.phone ? (
                              survey.submitter.phone
                            ) : (
                              <span className="text-text-muted">None provided</span>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-text-muted font-medium">Contact not recorded</p>
                  )}
                </div>

                <div className="bg-foreground p-4 border border-border rounded-xl">
                  <p className="text-lg font-serif font-bold text-text-dark pb-2">Notes</p>
                  <p className="text-text-dark font-medium whitespace-pre-wrap">
                    {survey?.notes ? survey.notes : "N/A"}
                  </p>
                </div>
              </>
            )}

            {formError ? <p className="text-destructive font-medium">{formError}</p> : null}
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
                    onOpenChange(false);
                  }}
                >
                  Cancel
                </AppButton>
                {isEditing ? (
                  <AppButton disabled={isSubmitting || !hasFormChanges} type="submit">
                    {isSubmitting
                      ? isAddingSurvey
                        ? "Adding…"
                        : "Saving…"
                      : isAddingSurvey
                        ? "Add Survey"
                        : "Save Changes"}
                  </AppButton>
                ) : null}
              </div>
            </div>
          </ModalFooter>
        </form>
      </ModalContent>

      <Modal open={deleteConfirmationOpen} onOpenChange={setDeleteConfirmationOpen}>
        <ModalContent
          className="bg-card"
          closeOnOverlayClick={false}
          showCloseButton={false}
          widthClassName="px-6 md:px-8"
        >
          <ModalHeader>
            <div className="flex items-center justify-between gap-x-4">
              <h2 className="w-full text-center text-2xl text-text-dark font-serif font-extrabold">
                {`Delete Survey #${survey?.id ?? ""}`}
              </h2>
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
                {isDeleting ? "Deleting..." : "Delete Survey"}
              </AppButton>
            </div>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
