import { createClient } from "jsr:@supabase/supabase-js@2";
import { getNextCronOccurrence } from "../_shared/cron.ts";

Deno.serve(async () => {
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  // Find all due reminders. No locking here — fire_reminder locks per row.
  // LIMIT 500 is a soft cap; anything beyond it picks up next minute.
  const { data: due, error } = await supabase
    .from("reminders")
    .select("id, crons_expression")
    .eq("is_active", true)
    .lte("next_run_at", new Date().toISOString())
    .order("next_run_at", { ascending: true })
    .limit(500);

  if (error) throw error;
  if (!due?.length) {
    return new Response(JSON.stringify({ fired: 0, failed: 0, total: 0 }), {
      headers: { "content-type": "application/json" },
    });
  }

  // Precompute next-run timestamps in a single pass. Any reminder with a
  // malformed cron expression is recorded as a compute failure and skipped
  // so it doesn't poison the RPC payload or block the rest of the batch.
  const ids: number[] = [];
  const nextRunAts: string[] = [];
  const computeFailures: { id: number; error: string }[] = [];

  for (const r of due) {
    try {
      const nextRunAt = getNextCronOccurrence(r.crons_expression); // PST-aware
      ids.push(r.id);
      nextRunAts.push(nextRunAt.toISOString());
    } catch (e) {
      console.error(`getNextCronOccurrence failed for ${r.id}:`, e);
      computeFailures.push({ id: r.id, error: String(e) });
    }
  }

  // One round-trip to the database, regardless of batch size. The per-row
  // try/catch lives inside fire_reminders_batch now.
  const { data: result, error: rpcError } = await supabase.rpc("fire_reminders_batch", {
    p_reminder_ids: ids,
    p_next_run_ats: nextRunAts,
  });

  if (rpcError) {
    console.error("fire_reminders_batch failed:", rpcError);
    return new Response(JSON.stringify({ error: rpcError.message }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }

  // rpc() with a `returns table` function gives back an array of rows.
  const fired = result?.[0]?.fired ?? 0;
  const failed = (result?.[0]?.failed ?? 0) + computeFailures.length;

  return new Response(
    JSON.stringify({
      fired,
      failed,
      total: due.length,
      computeFailures: computeFailures.length ? computeFailures : undefined,
    }),
    { headers: { "content-type": "application/json" } },
  );
});
