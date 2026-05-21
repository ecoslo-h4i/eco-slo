import type { SurveyTaskOption } from "@/types/survey";
import { SelectField } from "@/components/ui/form-controls";
import FormSection from "./FormSection";

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
        <SelectField
          id="survey-task"
          value={value}
          onChange={onChange}
          disabled={disabled}
          ariaInvalid={!!error}
          ariaDescribedBy={error ? "survey-err-task" : undefined}
          placeholder="Select a task..."
          required
          options={tasks.map((task) => ({ label: task.label, value: String(task.id) }))}
        />
        {error ? (
          <p id="survey-err-task" className="mt-2 text-sm text-danger" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </FormSection>
  );
}
