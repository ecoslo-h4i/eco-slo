import { createClient } from "jsr:@supabase/supabase-js@2";
import { Resend } from "npm:resend";
import { render } from "npm:@react-email/render@1.0.4";
import * as React from "npm:react@19.0.0";
import { TaskEmail } from "../_shared/emails/TaskEmail.tsx";

Deno.serve(async () => {
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const resend = new Resend(Deno.env.get("RESEND_API_KEY")!);

  // Pull up to 100 pending (task, assignee) email jobs
  const { data: jobs, error } = await supabase.rpc("get_pending_email_jobs", {
    p_limit: 100,
  });
  if (error) throw error;
  if (!jobs?.length) return new Response("no pending emails");

  // Build the Resend batch payload
  const batch = await Promise.all(
    jobs.map(async (j) => ({
      // TODO: replace "from" line with ECOSLO's email once we get their domain
      from: "onboarding@resend.dev",
      to: j.member_email,
      subject: `Task: ${j.task_title}`,
      html: await render(
        React.createElement(TaskEmail, {
          firstname: j.member_firstname,
          title: j.task_title,
          message: j.task_message,
        }),
      ),
    })),
  );

  const result = await resend.batch.send(batch);

  // Mark the touched tasks as sent. Note: a task may appear in `jobs`
  // multiple times (group task with N assignees → N rows), but we only
  // need to mark email_sent_at once per task. Use a Set to dedupe.
  const taskIds = [...new Set(jobs.map((j) => j.task_id))];

  if (result.error) {
    await supabase.rpc("increment_email_attempts", {
      p_task_ids: taskIds,
      p_error: result.error.message,
    });
  } else {
    await supabase.from("tasks").update({ email_sent_at: new Date().toISOString() }).in("id", taskIds);
  }

  return new Response(JSON.stringify({ sent: batch.length }));
});
