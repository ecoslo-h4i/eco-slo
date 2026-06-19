-- =============================================================================
-- ECOSLO: Watering/Mulching survey defaults
-- =============================================================================
-- Watering and Mulching work should allow surveys by default, but surveys should
-- not block completion unless an admin explicitly configures the item as required.
-- This migrates rows that match the old default-required backfill.
-- =============================================================================

update public.templates
set survey_mode = 'optional'::public."TaskSurveyMode",
    survey_required_count = 0
where type in ('Watering', 'Mulching')
  and survey_mode = 'required'::public."TaskSurveyMode"
  and survey_required_count = 1;

update public.reminders
set survey_mode = 'optional'::public."TaskSurveyMode",
    survey_required_count = 0
where type in ('Watering', 'Mulching')
  and survey_mode = 'required'::public."TaskSurveyMode"
  and survey_required_count = 1;

update public.tasks t
set survey_mode = 'optional'::public."TaskSurveyMode",
    survey_required_count = 0,
    surveys_needed = 0
where t.type in ('Watering', 'Mulching')
  and t.survey_mode = 'required'::public."TaskSurveyMode"
  and t.is_complete = false
  and exists (
    select 1
    from public.reminders r
    where r.id = t.reminder_id
      and r.type = t.type
      and r.survey_mode = 'optional'::public."TaskSurveyMode"
  );

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
      select array_agg(ecoslo_num order by ecoslo_num) into v_tree_targets
      from trees
      where tree_keeper_id = v_assignee;

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

comment on column public.reminders.survey_mode is
  'Survey mode copied onto generated tasks. Watering/Mulching default to optional surveys unless configured otherwise.';
