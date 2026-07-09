import type { Enums } from "@/database/database.types";

export const SURVEY_ISSUE_OPTIONS = [
  { value: "watering", label: "Watering" },
  { value: "mulching", label: "Mulching / soil" },
  { value: "pest_damage", label: "Pests or disease" },
  { value: "structural", label: "Structural / stability" },
  { value: "signage", label: "Signage" },
  { value: "other", label: "Other" },
] as const satisfies readonly { value: Enums<"SurveyIssue">; label: string }[];

export type SurveyIssueValue = (typeof SURVEY_ISSUE_OPTIONS)[number]["value"];

export function isSurveyIssueValue(value: unknown): value is SurveyIssueValue {
  return typeof value === "string" && SURVEY_ISSUE_OPTIONS.some((option) => option.value === value);
}

/** Human-readable label for an issue value; "N/A" for null/unknown (legacy rows). */
export function surveyIssueLabel(issue: Enums<"SurveyIssue"> | null | undefined): string {
  return SURVEY_ISSUE_OPTIONS.find((option) => option.value === issue)?.label ?? "N/A";
}

/** Detail fields shared by every survey write — maps 1:1 to `public.surveys` columns. */
export type SurveyFields = {
  issue: SurveyIssueValue;
  /** Present when `issue` is `"other"`. */
  issue_other: string | null;
  /** URL string only; binary images are not stored. */
  image_link: string | null;
  admin_contact: boolean;
  /** Free-form notes from the submitter (may be long). */
  notes: string | null;
};

/** Matches POST /api/public/surveys — maps to `public.surveys` columns. */
export type SurveyInsertPayload = SurveyFields & {
  /** `tasks.id` */
  task: number;
  /** `trees.ecoslo_num` */
  tree: number | null;
};

/** Normalizes raw form state into the column shape (trimmed, empty → null). */
export function buildSurveyFields(input: {
  issue: SurveyIssueValue;
  issueOther: string;
  imageLink: string;
  adminContact: boolean;
  notes: string;
}): SurveyFields {
  const other = input.issueOther.trim();
  return {
    issue: input.issue,
    issue_other: input.issue === "other" && other ? other : null,
    image_link: input.imageLink.trim() || null,
    admin_contact: input.adminContact,
    notes: input.notes.trim() || null,
  };
}
