import type { SurveyInsertPayload } from "@/types/survey";

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
