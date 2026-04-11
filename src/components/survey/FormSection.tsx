import type { ReactNode } from "react";
import { surveyCardClass, surveySectionTitleClass } from "./formStyles";

type FormSectionProps = {
  title: string;
  titleId: string;
  children: ReactNode;
};

/** Reusable card for grouped fields (surveys, future issue reports). */
export default function FormSection({ title, titleId, children }: FormSectionProps) {
  return (
    <section className={surveyCardClass} aria-labelledby={titleId}>
      <h2 id={titleId} className={surveySectionTitleClass}>
        {title}
      </h2>
      <div className="mt-5 flex flex-col gap-4">{children}</div>
    </section>
  );
}
