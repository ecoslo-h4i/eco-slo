import type { SurveyTreeOption } from "@/types/survey";
import FormSection from "./FormSection";
import { surveyFieldClass } from "./formStyles";

export type { SurveyTreeOption };

type TreeSelectSectionProps = {
  trees: SurveyTreeOption[];
  value: string;
  onChange: (ecosloNum: string) => void;
  disabled?: boolean;
  error?: string;
};

function formatTreeLabel(t: SurveyTreeOption): string {
  const primary = t.common_name?.trim() || t.species_name?.trim() || "Tree";
  return `#${t.ecoslo_num} — ${primary}`;
}

export default function TreeSelectSection({ trees, value, onChange, disabled, error }: TreeSelectSectionProps) {
  return (
    <FormSection title="Tree" titleId="survey-heading-tree">
      <div>
        <select
          id="survey-tree"
          className={surveyFieldClass}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          aria-labelledby="survey-heading-tree"
          aria-invalid={!!error}
          aria-describedby={error ? "survey-err-tree" : undefined}
          required
        >
          <option value="">Select a tree…</option>
          {trees.map((t) => (
            <option key={t.ecoslo_num} value={String(t.ecoslo_num)}>
              {formatTreeLabel(t)}
            </option>
          ))}
        </select>
        {error ? (
          <p id="survey-err-tree" className="mt-2 text-sm text-red-700" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </FormSection>
  );
}
