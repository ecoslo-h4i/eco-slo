"use client";

import { fetchPublicTrees, submitSurvey } from "@/lib/surveyPublicApi";
import {
  buildSurveyBodyPayload,
  SURVEY_ISSUE_OPTIONS,
  type SurveyIssueValue,
  type SurveyTreeOption,
} from "@/types/survey";
import { useCallback, useEffect, useState } from "react";
import { AppButton, SelectField, TextField, TextAreaField } from "@/components/ui/form-controls";
import { cn } from "@/lib/utils";

const DEFAULT_ISSUE: SurveyIssueValue = "watering";

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
  onCompleted: () => void;
}

export default function TaskSurveyForm({ taskId, onCompleted }: TaskSurveyFormProps) {
  const [trees, setTrees] = useState<SurveyTreeOption[]>([]);
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

  const loadData = useCallback(async () => {
    setLoadError(null);
    try {
      const result = await fetchPublicTrees();
      setTrees(result.trees);
      setLoadError(result.error);
    } catch {
      setLoadError("Could not load tree options. Please try again.");
      setTrees([]);
    }
  }, []);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    void loadData();
  }, [loadData]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const setIssue = (v: SurveyIssueValue) => {
    setIssueState(v);
    if (v !== "other") {
      setFieldErrors((prev) => {
        if (!prev.issueOther) return prev;
        const next = { ...prev };
        delete next.issueOther;
        return next;
      });
    }
  };

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (issue === "other" && !issueOther.trim()) {
      next.issueOther = 'Add a description when "Other" is selected.';
    }
    if (!isValidOptionalHttpUrl(imageLink)) {
      next.imageLink = "Enter a valid http(s) URL or leave this blank.";
    }
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitMessage(null);
    if (!validate()) return;

    const body = buildSurveyBodyPayload({
      issue,
      issueOther,
      imageLink,
      adminContact,
      notes,
    });

    const treeValue = treeEcoslo ? Number(treeEcoslo) : null;

    setSubmitting(true);
    try {
      const result = await submitSurvey({
        task: taskId,
        tree: treeValue,
        body,
      });
      if (!result.ok) {
        setSubmitMessage({ type: "err", text: result.message });
        return;
      }
      setSubmitMessage({ type: "ok", text: "Survey submitted. Task completed." });
      setTimeout(onCompleted, 800);
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

      {/* Tree */}
      <div className="flex flex-col items-start gap-y-1">
        <p className="text-text-muted font-semibold">Tree (optional)</p>
        <SelectField
          value={treeEcoslo}
          onChange={setTreeEcoslo}
          disabled={submitting}
          placeholder="Select a tree..."
          className="bg-button-muted"
          options={trees.map((tree) => ({ label: formatTreeLabel(tree), value: String(tree.ecoslo_num) }))}
        />
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
    </form>
  );
}
