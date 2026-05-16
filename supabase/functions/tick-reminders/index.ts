import { createClient } from "jsr:@supabase/supabase-js@2";
import { computeNextRunAt } from "../_shared/cron.js";

Deno.serve(async () => {
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  // Find all due reminders. No locking here — fire_reminder locks per row.
  // LIMIT 500 is a soft cap; anything beyond it picks up next minute.
  const { data: due, error } = await supabase
    .from("reminders")
    .select("id, crons_expression")
    .eq("is_active", true)
    .lte("next_run_at", new Date().toISOString())
    .limit(500);

  if (error) throw error;

  let fired = 0;
  let failed = 0;
  for (const r of due ?? []) {
    try {
      const nextRunAt = computeNextRunAt(r.crons_expression); // PST-aware
      const { error: rpcError } = await supabase.rpc("fire_reminder", {
        p_reminder_id: r.id,
        p_next_run_at: nextRunAt.toISOString(),
      });
      if (rpcError) throw rpcError;
      fired++;
    } catch (e) {
      // Log and continue — one bad reminder shouldn't stop the others
      console.error(`fire_reminder failed for ${r.id}:`, e);
      failed++;
    }
  }

  return new Response(JSON.stringify({ fired, failed, total: due?.length ?? 0 }), {
    headers: { "content-type": "application/json" },
  });
});
