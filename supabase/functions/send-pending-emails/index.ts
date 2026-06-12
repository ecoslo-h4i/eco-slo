import { createClient } from "jsr:@supabase/supabase-js@2";
import { Resend } from "npm:resend";
import { render } from "npm:@react-email/render@1.0.4";
import * as React from "npm:react@19.0.0";
import { TaskEmail } from "../_shared/emails/TaskEmail.tsx";
import { MESSAGE_VARIABLES, messageVariableToken, type MessageVariable } from "../_shared/message-variables.ts";

type EmailJob = {
  task_id: number;
  member_email: string;
  member_firstname: string;
  member_tree_count: number;
  member_tree_names: string;
  task_title: string;
  task_message: string;
};

// One resolver per supported variable. Typed Record<MessageVariable, ...> so a
// new variable added to _shared/message-variables.ts won't compile until it's
// handled here — keeping the reminder-form chips and this substitution in sync.
const messageVariableResolvers: Record<MessageVariable, (job: EmailJob) => string> = {
  firstName: (job) => job.member_firstname ?? "",
  treeCount: (job) => String(job.member_tree_count ?? 0),
  treeNames: (job) => job.member_tree_names ?? "",
};

// Replace each known {token} with the recipient's value. Unknown or misspelled
// tokens are left untouched (rendered literally) by design.
function applyMessageVariables(message: string, job: EmailJob): string {
  let result = message;
  for (const name of MESSAGE_VARIABLES) {
    result = result.replaceAll(messageVariableToken(name), messageVariableResolvers[name](job));
  }
  return result;
}

Deno.serve(async () => {
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const resend = new Resend(Deno.env.get("RESEND_API_KEY")!);

  // Base URL of the deployed app (set via `supabase secrets set SITE_URL=…`),
  // used for the "View Your Tasks" button. If unset, the email simply omits
  // the button rather than sending a broken link.
  const siteUrl = Deno.env.get("SITE_URL")?.trim().replace(/\/+$/, "");
  const tasksUrl = siteUrl ? `${siteUrl}/tasks` : undefined;

  // Pull up to 100 pending (task, assignee) email jobs
  const { data: jobs, error } = await supabase.rpc("get_pending_email_jobs", {
    p_limit: 100,
  });
  if (error) throw error;
  if (!jobs?.length) return new Response("no pending emails");

  // Build the Resend batch payload
  const batch = await Promise.all(
    jobs.map(async (j) => ({
      from: "no-reply@notifications.ecoslo.org",
      to: j.member_email,
      subject: `Task: ${j.task_title}`,
      html: await render(
        React.createElement(TaskEmail, {
          firstname: j.member_firstname,
          title: j.task_title,
          message: applyMessageVariables(j.task_message, j),
          tasksUrl,
        }),
      ),
    })),
  );

  const { data, error: resendError } = await resend.batch.send(batch, {
    batchValidation: "permissive",
  });

  // Top-level request failure (auth, network, malformed request): every job
  // in this batch is unsent. Bump attempts on all of them and bail.
  if (resendError) {
    const allTaskIds = [...new Set(jobs.map((j) => j.task_id))];
    await supabase.rpc("increment_email_attempts", {
      p_task_ids: allTaskIds,
      p_error: resendError.message,
    });
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }

  // Permissive mode: data contains the queued emails, errors contains the
  // per-index validation failures. `errors` is undefined if every email
  // in the batch was valid, so default it.
  const failedIndices = new Set<number>((data?.errors ?? []).map((e: { index: number }) => e.index));

  // A task may produce N rows in `jobs` (group tasks: one per assignee).
  // A task is considered "sent" only if every one of its rows succeeded;
  // if any assignee row failed, the task should be retried so the failed
  // recipient gets another shot. Group jobs by task_id and record the
  // first error message seen for each failed task.
  const taskOutcomes = new Map<number, { ok: boolean; firstError?: string }>();
  for (let i = 0; i < jobs.length; i++) {
    const taskId = jobs[i].task_id;
    const prior = taskOutcomes.get(taskId);
    const failed = failedIndices.has(i);
    const errMsg = failed
      ? (data?.errors?.find((e: { index: number }) => e.index === i)?.message ?? "unknown error")
      : undefined;

    if (!prior) {
      taskOutcomes.set(taskId, { ok: !failed, firstError: errMsg });
    } else if (failed && prior.ok) {
      taskOutcomes.set(taskId, { ok: false, firstError: errMsg });
    }
  }

  const sentTaskIds: number[] = [];
  const failedByError = new Map<string, number[]>();
  for (const [taskId, outcome] of taskOutcomes) {
    if (outcome.ok) {
      sentTaskIds.push(taskId);
    } else {
      const key = outcome.firstError ?? "unknown error";
      if (!failedByError.has(key)) failedByError.set(key, []);
      failedByError.get(key)!.push(taskId);
    }
  }

  if (sentTaskIds.length) {
    await supabase.from("tasks").update({ email_sent_at: new Date().toISOString() }).in("id", sentTaskIds);
  }

  // One RPC per distinct error message keeps email_last_error informative
  // without N round-trips. In practice failures cluster around 1-2 causes.
  for (const [errMsg, taskIds] of failedByError) {
    await supabase.rpc("increment_email_attempts", {
      p_task_ids: taskIds,
      p_error: errMsg,
    });
  }

  return new Response(
    JSON.stringify({
      attempted: batch.length,
      sent: sentTaskIds.length,
      failed_tasks: [...failedByError.values()].reduce((a, b) => a + b.length, 0),
    }),
    { headers: { "content-type": "application/json" } },
  );
});
