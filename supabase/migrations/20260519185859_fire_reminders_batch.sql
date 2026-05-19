-- =============================================================================
-- ECOSLO: fire_reminders_batch
-- =============================================================================
-- A batched version of the existing fire_reminders helper function.
-- Saves on CPU execution time by reducing the number of RPC calls from N to 1.
-- Handles the cron parsing internally, instead of offloading to Postgres,
-- which enables timezone-safe logic.
-- =============================================================================
create or replace function public.fire_reminders_batch(
  p_reminder_ids  bigint[],
  p_next_run_ats  timestamptz[]
) returns table (fired int, failed int)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_fired  int := 0;
  v_failed int := 0;
  i int;
begin
  if array_length(p_reminder_ids, 1) is distinct from array_length(p_next_run_ats, 1) then
    raise exception 'reminder_ids and next_run_ats length mismatch';
  end if;

  for i in 1 .. coalesce(array_length(p_reminder_ids, 1), 0) loop
    begin
      perform public.fire_reminder(p_reminder_ids[i], p_next_run_ats[i]);
      v_fired := v_fired + 1;
    exception when others then
      raise warning 'fire_reminder failed for id=% : %', p_reminder_ids[i], sqlerrm;
      v_failed := v_failed + 1;
    end;
  end loop;

  return query select v_fired, v_failed;
end;
$$;

grant execute on function public.fire_reminders_batch(bigint[], timestamptz[])
  to service_role;