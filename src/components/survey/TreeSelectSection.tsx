import type { SurveyTreeOption } from "@/types/survey";
import { SelectField } from "@/components/ui/form-controls";
import FormSection from "./FormSection";

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
        <SelectField
          id="survey-tree"
          value={value}
          onChange={onChange}
          disabled={disabled}
          ariaInvalid={!!error}
          ariaDescribedBy={error ? "survey-err-tree" : undefined}
          placeholder="Select a tree..."
          required
          options={trees.map((tree) => ({ label: formatTreeLabel(tree), value: String(tree.ecoslo_num) }))}
        />
        {error ? (
          <p id="survey-err-tree" className="mt-2 text-sm text-danger" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </FormSection>
  );
}
