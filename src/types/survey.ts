import type { Json } from "@/database/database.types";

/**
 * Payload stored in `public.surveys.body` (jsonb). All detailed answers live here;
 * `surveys.task` and `surveys.tree` hold FKs only.
 */
export type SurveyBodyPayload = {
  issue: SurveyIssueValue;
  /** Present when `issue` is `"other"`. */
  issueOther?: string;
  /** URL string only; binary images are not stored. */
  imageLink: string;
  adminContact: boolean;
  /** Free-form notes from the submitter (may be long). */
  notes: string;
};

export const SURVEY_ISSUE_OPTIONS = [
  { value: "watering", label: "Watering" },
  { value: "mulching", label: "Mulching / soil" },
  { value: "pest_damage", label: "Pests or disease" },
  { value: "structural", label: "Structural / stability" },
  { value: "signage", label: "Signage" },
  { value: "other", label: "Other" },
] as const;

export type SurveyIssueValue = (typeof SURVEY_ISSUE_OPTIONS)[number]["value"];

/** Matches POST /api/public/surveys — maps to `public.surveys` columns. */
export type SurveyInsertPayload = {
  /** `tasks.id` */
  task: number;
  /** `trees.ecoslo_num` */
  tree: number | null;
  body: SurveyBodyPayload;
};

export function buildSurveyBodyPayload(input: {
  issue: SurveyIssueValue;
  issueOther: string;
  imageLink: string;
  adminContact: boolean;
  notes: string;
}): SurveyBodyPayload {
  const other = input.issueOther.trim();
  return {
    issue: input.issue,
    ...(input.issue === "other" && other ? { issueOther: other } : {}),
    imageLink: input.imageLink.trim(),
    adminContact: input.adminContact,
    notes: input.notes.trim(),
  };
}

export function surveyBodyToJson(body: SurveyBodyPayload): Json {
  return body as unknown as Json;
}
