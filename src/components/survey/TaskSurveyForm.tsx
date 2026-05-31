"use client";

import { fetchPublicTrees, submitSurvey } from "@/lib/surveyPublicApi";
import {
  buildSurveyBodyPayload,
  SURVEY_ISSUE_OPTIONS,
  type SurveyIssueValue,
  type SurveyTreeOption,
} from "@/types/survey";
import type { Enums } from "@/database/database.types";
import { useCallback, useEffect, useState } from "react";
import { AppButton, SelectField, TextField, TextAreaField } from "@/components/ui/form-controls";
import { CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

const DEFAULT_ISSUE: SurveyIssueValue = "watering";

/** One target tree on a Watering/Mulching task, with its survey state. */
type ProgressTree = { ecoslo_num: number; label: string; surveyed: boolean };
type TaskProgress = { total: number; completed: number; trees: ProgressTree[] };

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

function formatTreeLabel(t: SurveyTreeOption): string {
  const primary = t.common_name?.trim() || t.species_name?.trim() || "Tree";
  return `#${t.ecoslo_num} — ${primary}`;
}

const choiceClass =
  "flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 transition hover:bg-off-white has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary/40";

interface TaskSurveyFormProps {
  taskId: number;
  /** Drives per-tree completion: Watering/Mulching tasks require a tree. */
  taskType?: Enums<"TaskType">;
  /** Fired after each non-final survey so the parent list can refresh its count. */
  onSurveySubmitted?: () => void;
  onCompleted: () => void;
}

export default function TaskSurveyForm({ taskId, taskType, onSurveySubmitted, onCompleted }: TaskSurveyFormProps) {
  const requireTree = taskType === "Watering" || taskType === "Mulching";

  // Other tasks: optional tree picked from the full (RLS-scoped) tree list.
  const [trees, setTrees] = useState<SurveyTreeOption[]>([]);
  // Watering/Mulching tasks: per-tree checklist from the snapshotted targets.
  const [progress, setProgress] = useState<TaskProgress | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [treeEcoslo, setTreeEcoslo] = useState("");
  const [issue, setIssueState] = useState<SurveyIssueValue>(DEFAULT_ISSUE);
  const [issueOther, setIssueOther] = useState("");
  const [imageLink, setImageLink] = useState("");
  const [notes, setNotes] = useState("");
  const [adminContact, setAdminContact] = useState(false);

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const fetchProgress = useCallback(async (): Promise<TaskProgress | null> => {
    const res = await fetch(`/api/public/tasks/${taskId}/survey-progress`, { cache: "no-store" });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(typeof json.message === "string" ? json.message : "Could not load task progress.");
    }
    return json.message as TaskProgress;
  }, [taskId]);

  const loadData = useCallback(async () => {
    setLoadError(null);
    try {
      if (requireTree) {
        setProgress(await fetchProgress());
      } else {
        const result = await fetchPublicTrees();
        setTrees(result.trees);
        setLoadError(result.error);
      }
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Could not load survey data. Please try again.");
      setProgress(null);
      setTrees([]);
    }
  }, [requireTree, fetchProgress]);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    void loadData();
  }, [loadData]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const remainingTrees = progress ? progress.trees.filter((t) => !t.surveyed) : [];
  const allDone = requireTree && progress != null && progress.total > 0 && progress.completed >= progress.total;

  const treeOptions = requireTree
    ? remainingTrees.map((t) => ({ label: t.label, value: String(t.ecoslo_num) }))
    : trees.map((tree) => ({ label: formatTreeLabel(tree), value: String(tree.ecoslo_num) }));

  const clearFieldError = (key: string) => {
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const setIssue = (v: SurveyIssueValue) => {
    setIssueState(v);
    if (v !== "other") clearFieldError("issueOther");
  };

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (requireTree && !treeEcoslo) {
      next.tree = "Select the tree you serviced.";
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

  const resetForNextTree = () => {
    setTreeEcoslo("");
    setIssueState(DEFAULT_ISSUE);
    setIssueOther("");
    setImageLink("");
    setNotes("");
    setAdminContact(false);
    setFieldErrors({});
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitMessage(null);
    if (!validate()) return;

    const body = buildSurveyBodyPayload({ issue, issueOther, imageLink, adminContact, notes });
    const treeValue = treeEcoslo ? Number(treeEcoslo) : null;

    setSubmitting(true);
    try {
      const result = await submitSurvey({ task: taskId, tree: treeValue, body });
      if (!result.ok) {
        setSubmitMessage({ type: "err", text: result.message });
        return;
      }

      if (!requireTree) {
        setSubmitMessage({ type: "ok", text: "Survey submitted." });
        setTimeout(onCompleted, 800);
        return;
      }

      // Watering/Mulching: refresh the checklist and either advance to the
      // next tree or finish once every target has been surveyed.
      const next = await fetchProgress().catch(() => null);
      if (next) setProgress(next);

      if (next && next.total > 0 && next.completed >= next.total) {
        setSubmitMessage({ type: "ok", text: "All trees surveyed. Task complete." });
        setTimeout(onCompleted, 800);
      } else {
        // Not finished: refresh the list behind the modal so its survey count
        // stays current even if the member closes before completing every tree.
        onSurveySubmitted?.();
        resetForNextTree();
        setSubmitMessage({
          type: "ok",
          text: next ? `Survey submitted — ${next.completed} of ${next.total} trees done.` : "Survey submitted.",
        });
      }
    } catch {
      setSubmitMessage({ type: "err", text: "Could not submit. Check your connection and try again." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-4">
      <p className="text-lg font-serif font-bold text-text-dark pb-2">Complete Survey</p>

      {loadError ? (
        <div role="alert" className="rounded-xl border border-danger-border bg-danger-bg px-4 py-3 text-sm text-danger">
          {loadError}{" "}
          <button
            type="button"
            className="font-medium underline underline-offset-2 hover:text-danger"
            onClick={() => void loadData()}
          >
            Retry
          </button>
        </div>
      ) : null}

      {/* Per-tree checklist (Watering/Mulching only) */}
      {requireTree && progress ? (
        <div className="flex flex-col gap-2 rounded-xl border border-border bg-off-white px-4 py-3">
          <p className="text-text-muted font-semibold">
            {progress.completed} of {progress.total} trees surveyed
          </p>
          <ul className="flex flex-col gap-1.5">
            {progress.trees.map((tree) => (
              <li key={tree.ecoslo_num} className="flex items-center gap-2 text-sm">
                {tree.surveyed ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
                ) : (
                  <Circle className="h-4 w-4 shrink-0 text-text-muted" />
                )}
                <span className={cn("text-text-dark", tree.surveyed && "text-text-muted line-through")}>
                  {tree.label}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {allDone ? (
        <p className={cn("text-sm font-medium", submitMessage?.type === "err" ? "text-danger" : "text-success")}>
          {submitMessage?.text ?? "All trees have been surveyed for this task."}
        </p>
      ) : (
        <>
          {/* Tree */}
          <div className="flex flex-col items-start gap-y-1">
            <p className="text-text-muted font-semibold">
              <span>{requireTree ? "Tree" : "Tree (optional)"}</span>
              {requireTree ? <span className="text-destructive font-semibold"> *</span> : null}
            </p>
            <SelectField
              value={treeEcoslo}
              onChange={(value) => {
                setTreeEcoslo(value);
                clearFieldError("tree");
              }}
              disabled={submitting}
              required={requireTree}
              placeholder="Select a tree..."
              className={cn("bg-button-muted", fieldErrors.tree && "border-danger")}
              options={treeOptions}
            />
            {fieldErrors.tree ? <p className="text-sm text-danger">{fieldErrors.tree}</p> : null}
          </div>

          {/* Issue */}
          <div className="flex flex-col items-start gap-y-1">
            <p className="text-text-muted font-semibold">
              <span>Issue Type</span>
              <span className="text-destructive font-semibold"> *</span>
            </p>
            <SelectField
              value={issue}
              onChange={(value) => setIssue(value as SurveyIssueValue)}
              disabled={submitting}
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
                disabled={submitting}
                placeholder="Describe the issue…"
                required
                rows={3}
                className={cn("bg-button-muted", fieldErrors.issueOther && "border-danger")}
              />
              {fieldErrors.issueOther ? <p className="text-sm text-danger">{fieldErrors.issueOther}</p> : null}
            </div>
          ) : null}

          {/* Image Link */}
          <div className="flex flex-col items-start gap-y-1">
            <p className="text-text-muted font-semibold">Image Link (optional)</p>
            <TextField
              type="url"
              inputMode="url"
              autoComplete="off"
              value={imageLink}
              onChange={(e) => setImageLink(e.target.value)}
              disabled={submitting}
              placeholder="https://…"
              className={cn("bg-button-muted", fieldErrors.imageLink && "border-danger")}
            />
            {fieldErrors.imageLink ? <p className="text-sm text-danger">{fieldErrors.imageLink}</p> : null}
          </div>

          {/* Notes */}
          <div className="flex flex-col items-start gap-y-1">
            <p className="text-text-muted font-semibold">Notes (optional)</p>
            <TextAreaField
              rows={3}
              className="bg-button-muted"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={submitting}
              placeholder="Anything else we should know…"
            />
          </div>

          {/* Admin Contact */}
          <div className="flex flex-col items-start gap-y-1">
            <p className="text-text-muted font-semibold">May an administrator contact you?</p>
            <div className="flex gap-3">
              <label className={choiceClass}>
                <input
                  type="radio"
                  name="survey-admin-contact"
                  className="h-4 w-4 accent-primary"
                  checked={adminContact === true}
                  onChange={() => setAdminContact(true)}
                  disabled={submitting}
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
                  disabled={submitting}
                />
                <span className="text-base text-text font-mulish">No</span>
              </label>
            </div>
          </div>

          {/* Submit */}
          <div className="flex items-center gap-4 pt-2">
            <AppButton type="submit" disabled={submitting}>
              {submitting ? "Submitting…" : "Submit Survey"}
            </AppButton>
            {submitMessage ? (
              <p className={submitMessage.type === "ok" ? "text-sm text-success" : "text-sm text-danger"}>
                {submitMessage.text}
              </p>
            ) : null}
          </div>
        </>
      )}
    </form>
  );
}
