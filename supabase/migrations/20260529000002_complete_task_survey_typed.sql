-- =============================================================================
-- ECOSLO: complete_task_survey (type-aware, tree-status driving)
-- =============================================================================
-- Survey submission calls this after inserting the survey row. It now:
--   * Authorizes the caller: only the task's assignees or an admin may
--     advance it. This both protects the generic decrement and stops a direct
--     SECURITY DEFINER call from flipping trees on someone else's behalf.
--   * For Watering/Mulching tasks (driven by the task's tree_targets snapshot):
--       - requires a tree, and that tree must be one of the task's targets;
--       - counts only the FIRST survey for a given (task, tree) pair toward
--         completion (distinct-tree enforcement — duplicates are ignored);
--       - recomputes coverage from the target list: surveys_needed mirrors the
--         remaining count and the task completes once every target is surveyed;
--       - marks that tree's weekly_watering_status / yearly_mulching_status
--         'Completed', but only if no newer task of the same type also targets
--         the tree (recency guard: a late survey on a stale task is ignored
--         because a newer cycle's task already exists).
--   * For 'Other' tasks: unchanged single-decrement behavior.
--
-- The added p_tree parameter changes the signature, so the old single-arg
-- function is dropped first. Execute is restricted to authenticated (the
-- survey route's role) and service_role.
-- =============================================================================

drop function if exists public.complete_task_survey(bigint);

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
  v_task     tasks%rowtype;
  v_total    integer;
  v_surveyed integer;
  v_count    integer;
begin
  -- Lock the task so concurrent survey submissions for it serialize.
  select * into v_task
  from tasks
  where id = p_task_id
  for update;

  if not found or v_task.is_complete then
    return;
  end if;

  -- Only an assignee or an admin may complete the task.
  if not (public.is_admin() or public.current_member_id() = any(v_task.assignees)) then
    return;
  end if;

  if v_task.type in ('Watering', 'Mulching') then
    -- Watering/Mulching require one survey per snapshotted target tree. The
    -- surveyed tree must be one of those targets (the snapshot is authoritative,
    -- so reassignment after fire time is intentionally not considered).
    if p_tree is null or v_task.tree_targets is null or not (p_tree = any(v_task.tree_targets)) then
      return;
    end if;

    -- A survey for this (task, tree) must actually exist before it counts
    -- toward coverage or flips the tree — this stops a bare RPC call from
    -- marking a tree serviced with no survey behind it. Coverage is recomputed
    -- from DISTINCT surveyed trees below, so a duplicate (a rare concurrent
    -- double-submit) is harmless and idempotent rather than dropped.
    select count(*) into v_count
    from surveys
    where task = p_task_id and tree = p_tree;

    if v_count < 1 then
      return;
    end if;

    -- Recompute coverage from the frozen target list: surveys_needed mirrors
    -- the remaining count, and the task completes once every target is surveyed.
    v_total := coalesce(array_length(v_task.tree_targets, 1), 0);

    select count(distinct s.tree) into v_surveyed
    from surveys s
    where s.task = p_task_id
      and s.tree = any(v_task.tree_targets);

    update tasks
    set surveys_needed = greatest(v_total - v_surveyed, 0),
        is_complete = (v_total > 0 and v_surveyed >= v_total),
        completion_date = case when (v_total > 0 and v_surveyed >= v_total) then now() else completion_date end
    where id = p_task_id;

    -- Mark the tree serviced only if no newer task of the same type also
    -- targets it (i.e. this is the current cycle's task, not a stale one).
    if not exists (
      select 1
      from tasks t2
      where t2.type = v_task.type
        and t2.id <> v_task.id
        and t2.created_at > v_task.created_at
        and t2.tree_targets @> array[p_tree]
    ) then
      if v_task.type = 'Watering' then
        update trees set weekly_watering_status = 'Completed' where ecoslo_num = p_tree;
      else
        update trees set yearly_mulching_status = 'Completed' where ecoslo_num = p_tree;
      end if;
    end if;

  else
    -- 'Other': original behavior — one decrement per survey.
    update tasks
    set surveys_needed = greatest(surveys_needed - 1, 0),
        is_complete = case when surveys_needed <= 1 then true else is_complete end,
        completion_date = case when surveys_needed <= 1 then now() else completion_date end
    where id = p_task_id and not is_complete;
  end if;
end;
$$;

revoke all on function public.complete_task_survey(bigint, bigint) from public;
grant execute on function public.complete_task_survey(bigint, bigint) to authenticated, service_role;
