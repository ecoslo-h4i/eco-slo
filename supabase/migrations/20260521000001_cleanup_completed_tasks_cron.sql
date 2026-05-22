-- Schedule daily cleanup of completed tasks older than 30 days.
-- Runs at 3:00 AM UTC every day.
--
-- NOTE: Replace the URL and Authorization bearer token below with
-- the actual SUPABASE_URL and SUPABASE_ANON_KEY for your environment.

select cron.schedule(
  'cleanup-completed-tasks',
  '0 3 * * *',
  $$
  select net.http_post(
    -- TODO: set per-environment: <SUPABASE_URL>/functions/v1/cleanup-completed-tasks
    url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/cleanup-completed-tasks',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      -- TODO: set per-environment: SUPABASE_ANON_KEY
      'Authorization', 'Bearer YOUR_ANON_KEY'
    ),
    body := '{}'::jsonb
  );
  $$
);
