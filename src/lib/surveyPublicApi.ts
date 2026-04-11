import type { SurveyInsertPayload, SurveyTaskOption, SurveyTreeOption } from "@/types/survey";

type MessageJson = { message?: unknown };

async function readJson(res: Response): Promise<MessageJson> {
  try {
    return (await res.json()) as MessageJson;
  } catch {
    return {};
  }
}

function apiErrorMessage(json: MessageJson, fallback: string): string {
  const m = json.message;
  return typeof m === "string" && m.trim().length > 0 ? m : fallback;
}

/**
 * Lists tasks for the survey selector via `GET /api/public/tasks` → `tasks.id` / label.
 */
export async function fetchPublicTasks(): Promise<{ tasks: SurveyTaskOption[]; error: string | null }> {
  const res = await fetch("/api/public/tasks", { method: "GET", cache: "no-store" });
  const json = await readJson(res);
  if (!res.ok) {
    return { tasks: [], error: apiErrorMessage(json, `Could not load tasks (${res.status}).`) };
  }
  const msg = json.message;
  if (!Array.isArray(msg)) {
    return { tasks: [], error: "Tasks response was invalid." };
  }
  return { tasks: msg as SurveyTaskOption[], error: null };
}

/**
 * Lists trees for the survey selector via `GET /api/public/survey/trees` → `trees.ecoslo_num`.
 */
export async function fetchPublicTrees(): Promise<{ trees: SurveyTreeOption[]; error: string | null }> {
  const res = await fetch("/api/public/survey/trees", { method: "GET", cache: "no-store" });
  const json = await readJson(res);
  if (!res.ok) {
    return { trees: [], error: apiErrorMessage(json, `Could not load trees (${res.status}).`) };
  }
  const msg = json.message;
  if (!Array.isArray(msg)) {
    return { trees: [], error: "Trees response was invalid." };
  }
  return { trees: msg as SurveyTreeOption[], error: null };
}

export type SurveyDropdownState = {
  tasks: SurveyTaskOption[];
  trees: SurveyTreeOption[];
  error: string | null;
};

/**
 * Parallel load for task and tree dropdowns (both public API routes).
 */
export async function loadSurveyDropdowns(): Promise<SurveyDropdownState> {
  const [t, tr] = await Promise.all([fetchPublicTasks(), fetchPublicTrees()]);
  const tasks = t.tasks;
  const trees = tr.trees;
  const parts: string[] = [];
  if (t.error) parts.push(t.error);
  if (tr.error) parts.push(tr.error);
  if (!t.error && tasks.length === 0) parts.push("No tasks are available.");
  if (!tr.error && trees.length === 0) parts.push("No trees are available.");
  return {
    tasks,
    trees,
    error: parts.length > 0 ? parts.join(" ") : null,
  };
}

/**
 * Submits `public.surveys` row via `POST /api/public/surveys`.
 */
export async function submitSurvey(
  payload: SurveyInsertPayload,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const res = await fetch("/api/public/surveys", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
    body: JSON.stringify(payload),
  });
  const json = await readJson(res);
  if (!res.ok) {
    return { ok: false, message: apiErrorMessage(json, `Submit failed (${res.status}).`) };
  }
  return { ok: true };
}
