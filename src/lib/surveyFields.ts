import { isSurveyIssueValue, type SurveyFields } from "@/types/survey";

/** Trimmed string or null; undefined when the input is not a string/null. */
function parseOptionalText(value: unknown): string | null | undefined {
  if (value == null) return null;
  if (typeof value !== "string") return undefined;
  return value.trim() || null;
}

export function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export type ParsedSurveyFields = { fields: SurveyFields; error?: never } | { fields?: never; error: string };

/**
 * Validates and normalizes the survey detail fields shared by every survey
 * write (`issue`, `issue_other`, `image_link`, `admin_contact`, `notes`).
 * Returns the column-shaped fields or a human-readable validation error.
 */
export function parseSurveyFields(input: Record<string, unknown>): ParsedSurveyFields {
  if (!isSurveyIssueValue(input.issue)) {
    return { error: "issue must be a valid survey issue type." };
  }
  const issue = input.issue;

  const issueOther = parseOptionalText(input.issue_other);
  const imageLink = parseOptionalText(input.image_link);
  const notes = parseOptionalText(input.notes);
  if (issueOther === undefined || imageLink === undefined || notes === undefined) {
    return { error: "issue_other, image_link, and notes must be strings or null." };
  }
  if (issue === "other" && !issueOther) {
    return { error: 'Describe the issue when "Other" is selected.' };
  }
  if (imageLink && !isValidHttpUrl(imageLink)) {
    return { error: "image_link must be a valid http(s) URL." };
  }
  if (typeof input.admin_contact !== "boolean") {
    return { error: "admin_contact must be a boolean." };
  }

  return {
    fields: {
      issue,
      issue_other: issue === "other" ? issueOther : null,
      image_link: imageLink,
      admin_contact: input.admin_contact,
      notes,
    },
  };
}
