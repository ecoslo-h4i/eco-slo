import { createClient } from "jsr:@supabase/supabase-js@2";
import { Resend } from "npm:resend";

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
  const batch = jobs.map((j) => ({
    from: "reminders@yourdomain.com",
    to: j.member_email,
    subject: `Task: ${j.task_title}`,
    html: renderEmail(j), // your template
  }));

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
