import FormSection from "./FormSection";
import { surveyFieldClass, surveyLabelClass } from "./formStyles";

type ImageLinkSectionProps = {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  error?: string;
};

export default function ImageLinkSection({ value, onChange, disabled, error }: ImageLinkSectionProps) {
  return (
    <FormSection title="Image link" titleId="survey-heading-image">
      <div>
        <label htmlFor="survey-image-link" className={surveyLabelClass}>
          URL (optional)
        </label>
        <input
          id="survey-image-link"
          type="url"
          inputMode="url"
          autoComplete="off"
          placeholder="https://…"
          className={surveyFieldClass}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          aria-invalid={!!error}
          aria-describedby={error ? "survey-err-image" : undefined}
        />
        {error ? (
          <p id="survey-err-image" className="mt-2 text-sm text-danger" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </FormSection>
  );
}
