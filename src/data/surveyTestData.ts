import type { SurveyTaskOption, SurveyTreeOption } from "@/types/survey";

/**
 * Reference-only fixtures for tests or Storybook. The live form loads options from
 * GET /api/public/tasks and GET /api/public/trees only.
 */
export const SURVEY_TEST_TASKS: SurveyTaskOption[] = [
  { id: 1, label: "Sample task A" },
  { id: 2, label: "Sample task B" },
];

export const SURVEY_TEST_TREES: SurveyTreeOption[] = [
  { ecoslo_num: 10001, common_name: "Coast live oak", species_name: "Quercus agrifolia" },
  { ecoslo_num: 10002, common_name: "Valley oak", species_name: "Quercus lobata" },
];
