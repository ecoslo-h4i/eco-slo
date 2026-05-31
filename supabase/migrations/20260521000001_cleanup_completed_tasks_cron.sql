-- =============================================================================
-- ECOSLO: schedule daily cleanup of completed tasks
-- =============================================================================
-- Invokes the cleanup-completed-tasks Edge Function once a day (03:00 UTC) to
-- delete completed tasks (and their linked surveys) older than 30 days.
--
-- Credentials are read from Supabase Vault at run time instead of being
-- hardcoded, matching the existing tick-reminders / send-pending-emails crons:
--   * project_url      -> the project's base URL
--   * service_role_key -> the bearer token. cleanup-completed-tasks performs
--     RLS-bypassing deletes and is a privileged maintenance endpoint, so it is
--     authorized with the service role -- NOT the public anon key, which is
--     shipped to browsers and would let anyone trigger the cleanup.
--
-- Both secrets already exist in Vault. cron.schedule upserts by job name, so
-- re-running this migration is idempotent.
-- =============================================================================

select cron.schedule(
  'cleanup-completed-tasks',
  '0 3 * * *',
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url')
           || '/functions/v1/cleanup-completed-tasks',
    headers := jsonb_build_object(
      'Authorization',
      'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'service_role_key'),
      'Content-Type', 'application/json'
    )
  );
  $$
);
