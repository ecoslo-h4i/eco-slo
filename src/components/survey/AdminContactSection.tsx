import FormSection from "./FormSection";
import { surveyLabelClass } from "./formStyles";

type AdminContactSectionProps = {
  value: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
};

const choiceClass =
  "flex cursor-pointer items-center gap-3 rounded-2xl border-2 border-black bg-white px-4 py-3 transition hover:bg-[#f7f2e8] has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[#758656]/40";

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
              className="h-4 w-4 accent-[#758656]"
              checked={value === true}
              onChange={() => onChange(true)}
              disabled={disabled}
            />
            <span className="text-base text-neutral-900">Yes</span>
          </label>
          <label className={choiceClass}>
            <input
              type="radio"
              name="survey-admin-contact"
              className="h-4 w-4 accent-[#758656]"
              checked={value === false}
              onChange={() => onChange(false)}
              disabled={disabled}
            />
            <span className="text-base text-neutral-900">No</span>
          </label>
        </div>
      </fieldset>
    </FormSection>
  );
}
