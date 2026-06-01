import { createClient } from "jsr:@supabase/supabase-js@2";

Deno.serve(async () => {
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  // Find completed tasks older than 30 days
  const { data: staleTasks, error: queryError } = await supabase
    .from("tasks")
    .select("id")
    .eq("is_complete", true)
    .lt("completion_date", cutoff);

  if (queryError) {
    console.error("Failed to query stale tasks:", queryError.message);
    return new Response(JSON.stringify({ error: queryError.message }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }

  const taskIds = (staleTasks ?? []).map((t) => t.id);

  if (taskIds.length === 0) {
    return new Response(JSON.stringify({ deleted: 0 }), {
      headers: { "content-type": "application/json" },
    });
  }

  // Detach surveys from tasks about to be deleted (preserve survey data)
  const { error: detachError } = await supabase.from("surveys").update({ task: null }).in("task", taskIds);

  if (detachError) {
    console.error("Failed to detach surveys:", detachError.message);
    return new Response(JSON.stringify({ error: detachError.message }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }

  // Delete the stale tasks
  const { data, error: taskError } = await supabase.from("tasks").delete().in("id", taskIds).select("id");

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
