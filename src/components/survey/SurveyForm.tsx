"use client";

import { loadSurveyDropdowns, submitSurvey } from "@/lib/surveyPublicApi";
import {
  buildSurveyBodyPayload,
  type SurveyIssueValue,
  type SurveyTaskOption,
  type SurveyTreeOption,
} from "@/types/survey";
import { useCallback, useEffect, useState } from "react";
import AdminContactSection from "./AdminContactSection";
import FormSection from "./FormSection";
import ImageLinkSection from "./ImageLinkSection";
import IssueSection from "./IssueSection";
import TaskSelectSection from "./TaskSelectSection";
import TreeSelectSection from "./TreeSelectSection";
import { surveyFieldClass, surveyLabelClass } from "./formStyles";

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

export default function SurveyForm() {
  const [tasks, setTasks] = useState<SurveyTaskOption[]>([]);
  const [trees, setTrees] = useState<SurveyTreeOption[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [taskId, setTaskId] = useState("");
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
    setSubmitMessage(null);
    try {
      const result = await loadSurveyDropdowns();
      setTasks(result.tasks);
      setTrees(result.trees);
      setLoadError(result.error);
    } catch {
      setLoadError("Could not load options. Please try again.");
      setTasks([]);
      setTrees([]);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

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
    if (!taskId) next.task = "Select a task.";
    else if (!Number.isFinite(Number(taskId)) || Number(taskId) <= 0) next.task = "Select a valid task.";
    if (!treeEcoslo) next.tree = "Select a tree.";
    else if (!Number.isFinite(Number(treeEcoslo)) || Number(treeEcoslo) <= 0) next.tree = "Select a valid tree.";
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

    const payload = {
      task: Number(taskId),
      tree: Number(treeEcoslo),
      body,
    };

    setSubmitting(true);
    try {
      const result = await submitSurvey(payload);
      if (!result.ok) {
        setSubmitMessage({ type: "err", text: result.message });
        return;
      }
      setSubmitMessage({ type: "ok", text: "Survey saved." });
      // Future: when tasks.surveys_needed exists, PATCH task here after successful insert.
    } catch {
      setSubmitMessage({ type: "err", text: "Could not submit. Check your connection and try again." });
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit = tasks.length > 0 && trees.length > 0 && !loadError;

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-3xl flex-col gap-8">
      {loadError ? (
        <div
          role="alert"
          className="rounded-2xl border-2 border-amber-800/35 bg-amber-50 px-4 py-3 text-sm text-amber-950"
        >
          {loadError}{" "}
          <button
            type="button"
            className="font-medium underline underline-offset-2 hover:text-amber-900"
            onClick={() => void loadData()}
          >
            Retry
          </button>
        </div>
      ) : null}

      <TaskSelectSection
        tasks={tasks}
        value={taskId}
        onChange={setTaskId}
        disabled={submitting}
        error={fieldErrors.task}
      />

      <TreeSelectSection
        trees={trees}
        value={treeEcoslo}
        onChange={setTreeEcoslo}
        disabled={submitting}
        error={fieldErrors.tree}
      />

      <IssueSection
        issue={issue}
        issueOther={issueOther}
        onIssueChange={setIssue}
        onIssueOtherChange={setIssueOther}
        disabled={submitting}
        error={fieldErrors.issueOther}
      />

      <ImageLinkSection value={imageLink} onChange={setImageLink} disabled={submitting} error={fieldErrors.imageLink} />

      <FormSection title="Notes" titleId="survey-heading-notes">
        <div>
          <label htmlFor="survey-notes" className={surveyLabelClass}>
            Additional information (optional)
          </label>
          <textarea
            id="survey-notes"
            rows={6}
            className={`${surveyFieldClass} min-h-[140px] resize-y`}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={submitting}
            placeholder="Anything else we should know…"
          />
        </div>
      </FormSection>

      <AdminContactSection value={adminContact} onChange={setAdminContact} disabled={submitting} />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <button
          type="submit"
          disabled={submitting || !canSubmit}
          className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-primary px-10 py-3 text-base font-medium text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? "Submitting…" : "Submit"}
        </button>
        {submitMessage ? (
          <p role="status" className={submitMessage.type === "ok" ? "text-sm text-success" : "text-sm text-danger"}>
            {submitMessage.text}
          </p>
        ) : null}
      </div>
    </form>
  );
}
