create or replace function public.complete_task_survey(p_task_id bigint)
returns void language plpgsql security definer set search_path = public as $$
begin
  update tasks
  set surveys_needed = greatest(surveys_needed - 1, 0),
      is_complete = case when surveys_needed <= 1 then true else is_complete end,
      completion_date = case when surveys_needed <= 1 then now() else completion_date end
  where id = p_task_id and not is_complete;
end;
$$;
