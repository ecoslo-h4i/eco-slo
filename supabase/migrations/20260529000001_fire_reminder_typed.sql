-- =============================================================================
-- ECOSLO: fire_reminder (type-aware)
-- =============================================================================
-- Extends the original fire_reminder:
--   * Every generated task inherits reminders.type.
--   * Watering/Mulching reminders are ALWAYS per-member (the is_group_task
--     flag is ignored): one task per assignee, with tree_targets snapshotting
--     the ecoslo_nums that member currently keeps and surveys_needed set to
--     that count, so the task only completes once the member has surveyed
--     every one of those trees. A member who keeps no trees gets no task.
--   * Firing opens a new cycle for each assignee's trees: status -> Pending
--     and next_(watering|mulching)_date -> the reminder's next scheduled run.
--     This is the "next cycle resets to Pending" half of the recency model;
--     completion (complete_task_survey) flips individual trees to Completed.
--   * 'Other' reminders keep the original behavior exactly.
--
-- create or replace preserves the existing owner and grants (service_role).
-- =============================================================================
create or replace function public.fire_reminder(p_reminder_id bigint, p_next_run_at timestamptz)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  r reminders%rowtype;
  v_assignee bigint;
  v_surveys_needed integer;
  v_tree_targets bigint[];
  v_tree_count integer;
  -- next_(watering|mulching)_date are DATE columns; anchor them to the PST
  -- calendar date of the next run, matching the scheduler's PST-aware cron.
  v_next_date date := (p_next_run_at at time zone 'America/Los_Angeles')::date;
begin
  -- Lock the row and re-check it's still due. SKIP LOCKED means a concurrent
  -- tick already processing this row exits cleanly instead of waiting.
  -- Re-checking next_run_at <= now() guards against the row being advanced
  -- between the Edge Function's scan and this call.
  select * into r
  from reminders
  where id = p_reminder_id
    and is_active = true
    and next_run_at <= now()
  for update skip locked;

  if not found then
    return;
  end if;

  if r.type in ('Watering', 'Mulching') then
    -- Per-member: one task per assignee, one survey required per tree kept.
    foreach v_assignee in array r.assignees loop
      -- Snapshot the trees this member keeps right now. This list is frozen
      -- onto the task and is what the survey checklist and completion check
      -- read; later assignment changes do not affect the in-flight task.
      select array_agg(ecoslo_num order by ecoslo_num) into v_tree_targets
      from trees
      where tree_keeper_id = v_assignee;

      v_tree_count := coalesce(array_length(v_tree_targets, 1), 0);

      -- A member with no assigned trees has nothing to do this cycle.
      if v_tree_count > 0 then
        insert into tasks (
          title, message, assignees, is_complete, completion_date,
          surveys_needed, reminder_id, type, tree_targets
        ) values (
          r.name, r.task_message, array[v_assignee], false, null,
          v_tree_count, r.id, r.type, v_tree_targets
        );

        -- Open the new cycle for this keeper's trees.
        if r.type = 'Watering' then
          update trees
          set weekly_watering_status = 'Pending',
              next_watering_date = v_next_date
          where tree_keeper_id = v_assignee;
        else
          update trees
          set yearly_mulching_status = 'Pending',
              next_mulching_date = v_next_date
          where tree_keeper_id = v_assignee;
        end if;
      end if;
    end loop;

  elsif r.is_group_task then
    v_surveys_needed := case
      when r.needs_survey then coalesce(array_length(r.assignees, 1), 0)
      else 0
    end;
    insert into tasks (
      title, message, assignees, is_complete, completion_date,
      surveys_needed, reminder_id, type
    ) values (
      r.name, r.task_message, r.assignees, false, null,
      v_surveys_needed, r.id, r.type
    );

  else
    v_surveys_needed := case when r.needs_survey then 1 else 0 end;
    foreach v_assignee in array r.assignees loop
      insert into tasks (
        title, message, assignees, is_complete, completion_date,
        surveys_needed, reminder_id, type
      ) values (
        r.name, r.task_message, array[v_assignee], false, null,
        v_surveys_needed, r.id, r.type
      );
    end loop;
  end if;

  -- Advance the reminder. Everything above + this UPDATE is one transaction;
  -- if any of it fails, none of it commits and the reminder stays due.
  update reminders
  set next_run_at = p_next_run_at,
      last_run_at = now()
  where id = p_reminder_id;
end;
$$;
