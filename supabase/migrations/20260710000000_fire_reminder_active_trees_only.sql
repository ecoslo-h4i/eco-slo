-- =============================================================================
-- ECOSLO: watering/mulching reminders only target ACTIVE trees
-- =============================================================================
-- Bug: tree keepers were receiving watering/mulching tasks (and the resulting
-- emails) for trees that have Graduated. fire_reminder collected a keeper's
-- trees with no status filter, so graduated trees landed in tasks.tree_targets
-- and were also reset to a 'Pending' watering/mulching status on every run.
--
-- Fix: filter to status = 'Active' in the three places the Watering/Mulching
-- branch touches trees:
--   1. the tree_targets snapshot written onto the generated task
--   2. the weekly_watering_status / next_watering_date reset
--   3. the yearly_mulching_status / next_mulching_date reset
--
-- Emails need no change: get_pending_email_jobs_variables resolves
-- {treeCount}/{treeNames} from the task's tree_targets snapshot when present,
-- and Watering/Mulching tasks always have one — so filtering (1) fixes the
-- email content automatically.
--
-- Side effect worth noting: the existing `if v_tree_count > 0` guard now also
-- means a keeper whose trees have ALL graduated generates no task at all —
-- no task, and therefore no email.
--
-- A function must be replaced whole, so everything else below is carried over
-- verbatim from 20260619000000_watering_mulching_optional_survey_defaults.sql
-- (including the 'optional' Watering/Mulching survey default). The only
-- changes are the three `and status = 'Active'` filters.
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
  v_survey_mode public."TaskSurveyMode";
  v_required_count integer;
  v_surveys_needed integer;
  v_tree_targets bigint[];
  v_tree_count integer;
  v_next_date date := (p_next_run_at at time zone 'America/Los_Angeles')::date;
begin
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
    foreach v_assignee in array r.assignees loop
      -- Only Active trees are reminded on; Graduated trees have left the program.
      select array_agg(ecoslo_num order by ecoslo_num) into v_tree_targets
      from trees
      where tree_keeper_id = v_assignee
        and status = 'Active';

      v_tree_count := coalesce(array_length(v_tree_targets, 1), 0);

      if v_tree_count > 0 then
        v_survey_mode := coalesce(r.survey_mode, 'optional'::public."TaskSurveyMode");
        v_required_count := case when v_survey_mode = 'required'::public."TaskSurveyMode" then v_tree_count else 0 end;
        v_surveys_needed := v_required_count;

        insert into tasks (
          title, message, assignees, is_complete, completion_date,
          surveys_needed, survey_mode, survey_required_count,
          reminder_id, type, tree_targets
        ) values (
          r.name, r.task_message, array[v_assignee], false, null,
          v_surveys_needed, v_survey_mode, v_required_count,
          r.id, r.type, v_tree_targets
        );

        if r.type = 'Watering' then
          -- Graduated trees keep their existing status/date.
          update trees
          set weekly_watering_status = 'Pending',
              next_watering_date = v_next_date
          where tree_keeper_id = v_assignee
            and status = 'Active';
        else
          update trees
          set yearly_mulching_status = 'Pending',
              next_mulching_date = v_next_date
          where tree_keeper_id = v_assignee
            and status = 'Active';
        end if;
      end if;
    end loop;

  elsif r.is_group_task then
    v_survey_mode := coalesce(r.survey_mode, 'none'::public."TaskSurveyMode");
    v_required_count := case
      when v_survey_mode = 'required'::public."TaskSurveyMode"
        then greatest(coalesce(nullif(r.survey_required_count, 0), array_length(r.assignees, 1), 1), 1)
      else 0
    end;
    v_surveys_needed := v_required_count;

    insert into tasks (
      title, message, assignees, is_complete, completion_date,
      surveys_needed, survey_mode, survey_required_count, reminder_id, type
    ) values (
      r.name, r.task_message, r.assignees, false, null,
      v_surveys_needed, v_survey_mode, v_required_count, r.id, r.type
    );

  else
    v_survey_mode := coalesce(r.survey_mode, 'none'::public."TaskSurveyMode");
    v_required_count := case
      when v_survey_mode = 'required'::public."TaskSurveyMode"
        then greatest(coalesce(nullif(r.survey_required_count, 0), 1), 1)
      else 0
    end;
    v_surveys_needed := v_required_count;

    foreach v_assignee in array r.assignees loop
      insert into tasks (
        title, message, assignees, is_complete, completion_date,
        surveys_needed, survey_mode, survey_required_count, reminder_id, type
      ) values (
        r.name, r.task_message, array[v_assignee], false, null,
        v_surveys_needed, v_survey_mode, v_required_count, r.id, r.type
      );
    end loop;
  end if;

  update reminders
  set next_run_at = p_next_run_at,
      last_run_at = now()
  where id = p_reminder_id;
end;
$$;
