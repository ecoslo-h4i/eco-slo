-- =============================================================================
-- ECOSLO: task survey modes and immutable tree linking
-- =============================================================================
-- Separates "a survey can be submitted" from "a survey blocks completion".
-- tasks.tree_targets remains the immutable linked-tree snapshot for a task.
-- =============================================================================

do $$
begin
  create type public."TaskSurveyMode" as enum ('none', 'optional', 'required');
exception
  when duplicate_object then null;
end $$;

alter table public.tasks
  add column if not exists survey_mode public."TaskSurveyMode" not null default 'none',
  add column if not exists survey_required_count integer not null default 0;

alter table public.reminders
  add column if not exists survey_mode public."TaskSurveyMode" not null default 'none',
  add column if not exists survey_required_count integer not null default 0;

alter table public.templates
  add column if not exists survey_mode public."TaskSurveyMode" not null default 'none',
  add column if not exists survey_required_count integer not null default 0;

update public.tasks
set survey_mode = case when surveys_needed > 0 then 'required'::public."TaskSurveyMode" else 'none'::public."TaskSurveyMode" end,
    survey_required_count = case when surveys_needed > 0 then surveys_needed else 0 end
where survey_mode = 'none'::public."TaskSurveyMode"
  and survey_required_count = 0;

update public.reminders
set survey_mode = case
      when type in ('Watering', 'Mulching') then 'required'::public."TaskSurveyMode"
      when needs_survey then 'required'::public."TaskSurveyMode"
      else 'none'::public."TaskSurveyMode"
    end,
    survey_required_count = case
      when type in ('Watering', 'Mulching') then 1
      when needs_survey then greatest(coalesce(array_length(assignees, 1), 1), 1)
      else 0
    end
where survey_mode = 'none'::public."TaskSurveyMode"
  and survey_required_count = 0;

update public.templates
set survey_mode = case
      when type in ('Watering', 'Mulching') then 'required'::public."TaskSurveyMode"
      when needs_survey then 'required'::public."TaskSurveyMode"
      else 'none'::public."TaskSurveyMode"
    end,
    survey_required_count = case when type in ('Watering', 'Mulching') or needs_survey then 1 else 0 end
where survey_mode = 'none'::public."TaskSurveyMode"
  and survey_required_count = 0;

alter table public.tasks
  drop constraint if exists tasks_survey_counts_nonnegative,
  add constraint tasks_survey_counts_nonnegative
  check (surveys_needed >= 0 and survey_required_count >= 0);

alter table public.tasks
  drop constraint if exists tasks_survey_mode_counts_consistent,
  add constraint tasks_survey_mode_counts_consistent
  check (
    (survey_mode in ('none', 'optional') and surveys_needed = 0 and survey_required_count = 0)
    or
    (survey_mode = 'required' and survey_required_count >= 1 and surveys_needed >= 0)
  );

alter table public.reminders
  drop constraint if exists reminders_survey_counts_nonnegative,
  add constraint reminders_survey_counts_nonnegative
  check (survey_required_count >= 0);

alter table public.templates
  drop constraint if exists templates_survey_counts_nonnegative,
  add constraint templates_survey_counts_nonnegative
  check (survey_required_count >= 0);

comment on column public.tasks.survey_mode is
  'Survey behavior for the task: none, optional, or required for completion.';
comment on column public.tasks.survey_required_count is
  'Number of counted surveys required before completion when survey_mode = required.';
comment on column public.reminders.survey_mode is
  'Survey mode copied onto generated tasks. Watering/Mulching required counts are derived from linked trees at fire time.';
comment on column public.reminders.survey_required_count is
  'Required survey count for generated non-tree tasks when survey_mode = required.';
comment on column public.templates.survey_mode is
  'Default survey mode copied into reminders created from this template.';
comment on column public.templates.survey_required_count is
  'Default required survey count copied into reminders for non-tree required survey tasks.';

-- Keep legacy needs_survey coherent for code that has not moved to survey_mode.
create or replace function public.sync_needs_survey_from_mode()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.needs_survey := new.survey_mode <> 'none'::public."TaskSurveyMode";
  return new;
end;
$$;

drop trigger if exists reminders_sync_needs_survey on public.reminders;
create trigger reminders_sync_needs_survey
before insert or update of survey_mode on public.reminders
for each row execute function public.sync_needs_survey_from_mode();

drop trigger if exists templates_sync_needs_survey on public.templates;
create trigger templates_sync_needs_survey
before insert or update of survey_mode on public.templates
for each row execute function public.sync_needs_survey_from_mode();

-- Explicit survey-to-tree logging.
create or replace function public.append_survey_log_to_tree()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.tree is not null then
    update public.trees
    set survey_logs = case
      when survey_logs is null then array[new.id]
      when not (new.id = any(survey_logs)) then survey_logs || new.id
      else survey_logs
    end
    where ecoslo_num = new.tree;
  end if;

  return new;
end;
$$;

drop trigger if exists surveys_append_tree_log on public.surveys;
create trigger surveys_append_tree_log
after insert on public.surveys
for each row execute function public.append_survey_log_to_tree();

create or replace function public.mark_task_tree_completed(
  p_task public.tasks,
  p_tree bigint
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_tree is null or p_task.type not in ('Watering', 'Mulching') then
    return;
  end if;

  if exists (
    select 1
    from public.tasks t2
    where t2.type = p_task.type
      and t2.id <> p_task.id
      and t2.created_at > p_task.created_at
      and t2.tree_targets @> array[p_tree]
  ) then
    return;
  end if;

  if p_task.type = 'Watering' then
    update public.trees
    set weekly_watering_status = 'Completed'
    where ecoslo_num = p_tree;
  else
    update public.trees
    set yearly_mulching_status = 'Completed'
    where ecoslo_num = p_tree;
  end if;
end;
$$;

revoke all on function public.mark_task_tree_completed(public.tasks, bigint) from public;

-- Survey submission calls this after inserting the survey row. It logs progress
-- for required tasks only; optional surveys never auto-complete a task.
create or replace function public.complete_task_survey(
  p_task_id bigint,
  p_tree    bigint default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_task       tasks%rowtype;
  v_targets    bigint[];
  v_required   integer;
  v_counted    integer;
  v_remaining  integer;
  v_has_survey boolean;
begin
  select * into v_task
  from public.tasks
  where id = p_task_id
  for update;

  if not found then
    return;
  end if;

  if not (public.is_admin() or public.current_member_id() = any(v_task.assignees)) then
    return;
  end if;

  v_targets := coalesce(v_task.tree_targets, array[]::bigint[]);

  if array_length(v_targets, 1) is not null then
    if p_tree is null or not (p_tree = any(v_targets)) then
      return;
    end if;

    select exists (
      select 1 from public.surveys where task = p_task_id and tree = p_tree
    ) into v_has_survey;

    if not v_has_survey then
      return;
    end if;

    perform public.mark_task_tree_completed(v_task, p_tree);

    if v_task.survey_mode <> 'required'::public."TaskSurveyMode" then
      return;
    end if;

    v_required := least(v_task.survey_required_count, coalesce(array_length(v_targets, 1), 0));

    select count(distinct s.tree) into v_counted
    from public.surveys s
    where s.task = p_task_id
      and s.tree = any(v_targets);
  else
    if v_task.survey_mode <> 'required'::public."TaskSurveyMode" then
      return;
    end if;

    v_required := v_task.survey_required_count;

    select count(*) into v_counted
    from public.surveys s
    where s.task = p_task_id;
  end if;

  v_remaining := greatest(v_required - v_counted, 0);

  update public.tasks
  set surveys_needed = v_remaining,
      is_complete = case when v_remaining = 0 then true else is_complete end,
      completion_date = case
        when v_remaining = 0 and completion_date is null then now()
        else completion_date
      end
  where id = p_task_id;
end;
$$;

revoke all on function public.complete_task_survey(bigint, bigint) from public;
grant execute on function public.complete_task_survey(bigint, bigint) to authenticated, service_role;

create or replace function public.complete_task(p_task_id bigint)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_task tasks%rowtype;
  v_tree bigint;
begin
  select * into v_task
  from public.tasks
  where id = p_task_id
  for update;

  if not found then
    return;
  end if;

  if not (public.is_admin() or public.current_member_id() = any(v_task.assignees)) then
    return;
  end if;

  if v_task.is_complete then
    return;
  end if;

  if v_task.survey_mode = 'required'::public."TaskSurveyMode" and v_task.surveys_needed > 0 then
    raise exception 'Required surveys are still outstanding.';
  end if;

  update public.tasks
  set is_complete = true,
      completion_date = now()
  where id = p_task_id;

  if v_task.type in ('Watering', 'Mulching') and v_task.tree_targets is not null then
    foreach v_tree in array v_task.tree_targets loop
      perform public.mark_task_tree_completed(v_task, v_tree);
    end loop;
  end if;
end;
$$;

revoke all on function public.complete_task(bigint) from public;
grant execute on function public.complete_task(bigint) to authenticated, service_role;

-- Tree keepers should complete tasks through complete_task(), not broad row updates.
drop policy if exists tasks_keeper_update_own on public.tasks;

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
        v_survey_mode := coalesce(r.survey_mode, 'required'::public."TaskSurveyMode");
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
