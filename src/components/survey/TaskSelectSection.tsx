import type { SurveyTaskOption } from "@/types/survey";
import FormSection from "./FormSection";
import { surveyFieldClass } from "./formStyles";

export type { SurveyTaskOption };

type TaskSelectSectionProps = {
  tasks: SurveyTaskOption[];
  value: string;
  onChange: (taskId: string) => void;
  disabled?: boolean;
  error?: string;
};

export default function TaskSelectSection({ tasks, value, onChange, disabled, error }: TaskSelectSectionProps) {
  return (
    <FormSection title="Task" titleId="survey-heading-task">
      <div>
        <select
          id="survey-task"
          className={surveyFieldClass}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          aria-labelledby="survey-heading-task"
          aria-invalid={!!error}
          aria-describedby={error ? "survey-err-task" : undefined}
          required
        >
          <option value="">Select a task…</option>
          {tasks.map((t) => (
            <option key={t.id} value={String(t.id)}>
              {t.label}
            </option>
          ))}
        </select>
        {error ? (
          <p id="survey-err-task" className="mt-2 text-sm text-red-700" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </FormSection>
  );
}
