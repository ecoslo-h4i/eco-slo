import { SURVEY_ISSUE_OPTIONS, type SurveyIssueValue } from "@/types/survey";
import FormSection from "./FormSection";
import { surveyFieldClass, surveyLabelClass } from "./formStyles";

type IssueSectionProps = {
  issue: SurveyIssueValue;
  issueOther: string;
  onIssueChange: (v: SurveyIssueValue) => void;
  onIssueOtherChange: (v: string) => void;
  disabled?: boolean;
  error?: string;
};

export default function IssueSection({
  issue,
  issueOther,
  onIssueChange,
  onIssueOtherChange,
  disabled,
  error,
}: IssueSectionProps) {
  const showOther = issue === "other";

  return (
    <FormSection title="Issue" titleId="survey-heading-issue">
      <div>
        <label htmlFor="survey-issue" className={surveyLabelClass}>
          Issue type
        </label>
        <select
          id="survey-issue"
          className={surveyFieldClass}
          value={issue}
          onChange={(e) => onIssueChange(e.target.value as SurveyIssueValue)}
          disabled={disabled}
          required
        >
          {SURVEY_ISSUE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {showOther ? (
        <div>
          <label htmlFor="survey-issue-other" className={surveyLabelClass}>
            Describe (other)
          </label>
          <textarea
            id="survey-issue-other"
            className={`${surveyFieldClass} min-h-[100px] resize-y`}
            value={issueOther}
            onChange={(e) => onIssueOtherChange(e.target.value)}
            disabled={disabled}
            placeholder="Describe the issue…"
            required
            aria-invalid={!!error}
            aria-describedby={error ? "survey-err-issue-other" : undefined}
          />
          {error ? (
            <p id="survey-err-issue-other" className="mt-2 text-sm text-danger" role="alert">
              {error}
            </p>
          ) : null}
        </div>
      ) : null}
    </FormSection>
  );
}
