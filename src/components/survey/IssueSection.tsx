import { SURVEY_ISSUE_OPTIONS, type SurveyIssueValue } from "@/types/survey";
import { SelectField } from "@/components/ui/form-controls";
import FormSection from "./FormSection";
import { surveyLabelClass, surveyTextareaClass } from "./formStyles";

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
        <SelectField
          id="survey-issue"
          value={issue}
          onChange={(value) => onIssueChange(value as SurveyIssueValue)}
          disabled={disabled}
          required
          options={SURVEY_ISSUE_OPTIONS.map((option) => ({ label: option.label, value: option.value }))}
        />
      </div>

      {showOther ? (
        <div>
          <label htmlFor="survey-issue-other" className={surveyLabelClass}>
            Describe (other)
          </label>
          <textarea
            id="survey-issue-other"
            className={`${surveyTextareaClass} min-h-[100px] resize-y`}
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
