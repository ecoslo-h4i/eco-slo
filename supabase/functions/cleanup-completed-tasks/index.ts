import { createClient } from "jsr:@supabase/supabase-js@2";

Deno.serve(async () => {
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  // Delete surveys linked to completed tasks older than 30 days
  const { error: surveyError } = await supabase
    .from("surveys")
    .delete()
    .filter(
      "task",
      "in",
      `(select id from tasks where is_complete = true and completion_date < now() - interval '30 days')`,
    );

  if (surveyError) {
    console.error("Failed to delete surveys:", surveyError.message);
    return new Response(JSON.stringify({ error: surveyError.message }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }

  // Delete completed tasks older than 30 days
  const { data, error: taskError } = await supabase
    .from("tasks")
    .delete()
    .eq("is_complete", true)
    .lt("completion_date", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
    .select("id");

  if (taskError) {
    console.error("Failed to delete tasks:", taskError.message);
    return new Response(JSON.stringify({ error: taskError.message }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }

  const deleted = data?.length ?? 0;

  return new Response(JSON.stringify({ deleted }), {
    headers: { "content-type": "application/json" },
  });
});
