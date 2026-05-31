-- =============================================================================
-- ECOSLO: get_pending_email_jobs — expose per-recipient data for message vars
-- =============================================================================
-- Reminder message bodies support author variables ({firstName}, {treeCount},
-- {treeNames}) that are substituted per recipient at email-send time by the
-- send-pending-emails Edge Function. This adds the data those variables need to
-- the existing per-(task, assignee) job query so the substitution stays a pure
-- string replace in the function (no extra round-trips):
--   * member_tree_count / member_tree_names use the task's tree_targets SNAPSHOT
--     when present (Watering/Mulching), so the email matches the task's frozen
--     scope; otherwise they fall back to the member's currently kept trees.
--
-- Adding columns changes the return type, so the function is dropped and
-- recreated. Execute is granted to service_role (the Edge Function's role).
-- =============================================================================

drop function if exists public.get_pending_email_jobs(integer);

create or replace function public.get_pending_email_jobs(p_limit integer default 100)
returns table (
  task_id bigint,
  assignee_id bigint,
  member_email text,
  member_firstname text,
  task_title text,
  task_message text,
  email_attempts integer,
  member_tree_count integer,
  member_tree_names text
)
language sql stable security definer
set search_path = public
as $$
  select
    t.id,
    m.id,
    m.email,
    m.firstname,
    t.title,
    t.message,
    t.email_attempts,
    -- {treeCount}: the task's frozen target list when present, else the
    -- member's current tree count. (tree_targets is null or non-empty, never
    -- an empty array, so array_length is null only for non-tree tasks.)
    coalesce(array_length(t.tree_targets, 1), m.trees_count)::int as member_tree_count,
    -- {treeNames}: names of the task's snapshotted trees when present, else the
    -- member's currently kept trees. Empty string when there are none.
    coalesce(
      case
        when t.tree_targets is not null then (
          select string_agg(coalesce(nullif(tr.common_name, ''), 'Tree #' || tr.ecoslo_num), ', ' order by tr.ecoslo_num)
          from trees tr
          where tr.ecoslo_num = any (t.tree_targets)
        )
        else (
          select string_agg(coalesce(nullif(tr.common_name, ''), 'Tree #' || tr.ecoslo_num), ', ' order by tr.ecoslo_num)
          from trees tr
          where tr.tree_keeper_id = m.id
        )
      end,
      ''
    ) as member_tree_names
  from tasks t
  cross join lateral unnest(t.assignees) as assignee_id
  join members m on m.id = assignee_id
  where t.email_sent_at is null
    and t.email_attempts < 5  -- give up after 5 attempts; investigate manually
    and t.is_complete = false
  order by t.created_at asc
  limit p_limit;
$$;

grant execute on function public.get_pending_email_jobs(integer) to service_role;
