import FormSection from "./FormSection";
import { surveyLabelClass } from "./formStyles";

type AdminContactSectionProps = {
  value: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
};

const choiceClass =
  "flex cursor-pointer items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 transition hover:bg-background has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary/40";

export default function AdminContactSection({ value, onChange, disabled }: AdminContactSectionProps) {
  return (
    <FormSection title="Administrator contact" titleId="survey-heading-admin">
      <fieldset>
        <legend className={`${surveyLabelClass} mb-3`}>May an administrator contact you about this?</legend>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <label className={choiceClass}>
            <input
              type="radio"
              name="survey-admin-contact"
              className="h-4 w-4 accent-primary"
              checked={value === true}
              onChange={() => onChange(true)}
              disabled={disabled}
            />
            <span className="text-base text-text">Yes</span>
          </label>
          <label className={choiceClass}>
            <input
              type="radio"
              name="survey-admin-contact"
              className="h-4 w-4 accent-primary"
              checked={value === false}
              onChange={() => onChange(false)}
              disabled={disabled}
            />
            <span className="text-base text-text">No</span>
          </label>
        </div>
      </fieldset>
    </FormSection>
  );
}
