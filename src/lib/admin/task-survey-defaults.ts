type TaskTypeSurveyBody = {
  needs_survey?: boolean;
  survey_mode?: "none" | "optional" | "required" | null;
  survey_required_count?: number;
  type?: "Watering" | "Mulching" | "Other" | null;
};

export function applyTaskTypeSurveyDefaults<T extends TaskTypeSurveyBody>(body: T): T {
  if ((body.type === "Watering" || body.type === "Mulching") && body.survey_mode == null) {
    return {
      ...body,
      needs_survey: true,
      survey_mode: "optional",
      survey_required_count: 0,
    };
  }

  return body;
}
