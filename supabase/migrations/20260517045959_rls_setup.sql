-- =============================================================================
-- ECOSLO: Auth linking + Row Level Security
-- =============================================================================
-- This migration:
--   1. Links public.members to auth.users via a nullable user_id column,
--      auto-populated by a trigger on first sign-in.
--   2. Adds SECURITY DEFINER helper functions used by RLS policies.
--   3. Creates a public_trees view exposing a non-sensitive column subset
--      to the anonymous map page.
--   4. Enables RLS on all app tables and installs per-role policies for
--      Admin and Tree Keeper members.
--
-- Idempotent: safe to re-run during development.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 1. Schema: link members <-> auth.users
-- -----------------------------------------------------------------------------

alter table public.members
  add column if not exists user_id uuid references auth.users(id) on delete set null;

comment on column public.members.user_id is
  'Linked auth.users.id. NULL until the member first signs in via magic link, then populated by trigger.';

-- One member per auth user. Partial so multiple unlinked rows (NULL) don't collide.
create unique index if not exists members_user_id_unique
  on public.members (user_id)
  where user_id is not null;

-- Case-insensitive unique email. Required for reliable lookup in the magic
-- link route and prevents "alice@x.com" vs "Alice@x.com" duplicates.
create unique index if not exists members_email_lower_unique
  on public.members (lower(email));

-- GIN indexes on array columns used by RLS policies. Postgres uses these to
-- accelerate `array_column @> ARRAY[value]` containment predicates in
-- policies below.
create index if not exists members_trees_assigned_gin
  on public.members using gin (trees_assigned);

create index if not exists tasks_assignees_gin
  on public.tasks using gin (assignees);


-- -----------------------------------------------------------------------------
-- 2. Helper functions
-- -----------------------------------------------------------------------------
-- SECURITY DEFINER lets these bypass RLS on members (avoiding recursion when
-- policies on members itself call is_admin()). STABLE allows the planner to
-- cache results within a statement.
-- -----------------------------------------------------------------------------

create or replace function public.current_member_id()
returns bigint
language sql
stable
security definer
set search_path = public
as $$
  select id from public.members where user_id = (select auth.uid())
$$;

comment on function public.current_member_id() is
  'Returns members.id for the current auth user, or NULL if not linked. Bypasses RLS.';

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.members
    where user_id = (select auth.uid())
      and role = 'Admin'
  )
$$;

comment on function public.is_admin() is
  'True if the current auth user is linked to a member with role = Admin.';

grant execute on function public.current_member_id() to authenticated;
grant execute on function public.is_admin()          to authenticated;


-- -----------------------------------------------------------------------------
-- 3. Trigger: link auth.users -> members on first sign-in
-- -----------------------------------------------------------------------------
-- Flow:
--   admin creates member (user_id IS NULL)
--   -> user clicks magic link
--   -> Supabase Auth creates auth.users row
--   -> this trigger fires, sets members.user_id = NEW.id
-- -----------------------------------------------------------------------------

create or replace function public.link_member_on_auth_signup()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.members
    set user_id = new.id
    where lower(email) = lower(new.email)
      and user_id is null;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_link_member on auth.users;
create trigger on_auth_user_created_link_member
  after insert on auth.users
  for each row execute function public.link_member_on_auth_signup();


-- -----------------------------------------------------------------------------
-- 4. Lock down members.user_id
-- -----------------------------------------------------------------------------
-- Only the trigger (running as SECURITY DEFINER with the function owner's
-- privileges) should ever write user_id. Admins update other columns through
-- their RLS policy; the column-level revoke prevents them from re-pointing
-- a member at a different auth.users row.
-- -----------------------------------------------------------------------------

revoke update (user_id) on public.members from authenticated;
revoke update (user_id) on public.members from anon;


-- -----------------------------------------------------------------------------
-- 5. Public view: non-sensitive tree columns for the anonymous map
-- -----------------------------------------------------------------------------
-- The map page should query this view, not the trees table. Anyone (anon or
-- authenticated) can SELECT from it. To add or remove publicly-visible columns,
-- edit the SELECT list here.
--
-- security_invoker = false (the default) makes the view run with its owner's
-- privileges, bypassing RLS on the underlying trees table. The view is the
-- public access boundary: the SELECT list below is the single source of truth
-- for what unauthenticated users can see. Anon has no direct access to trees
-- (see section 13).
-- -----------------------------------------------------------------------------

create or replace view public.public_trees
with (security_invoker = false)
as
select
  ecoslo_num,
  status,
  condition,
  species_name,
  common_name,
  latitude,
  longitude,
  address,
  date_planted,
  is_public,
  notes
from public.trees;

comment on view public.public_trees is
  'Whitelist of tree columns safe for unauthenticated map display.';

grant select on public.public_trees to anon, authenticated;


-- -----------------------------------------------------------------------------
-- 6. Enable RLS
-- -----------------------------------------------------------------------------

alter table public.members   enable row level security;
alter table public.trees     enable row level security;
alter table public.tasks     enable row level security;
alter table public.surveys   enable row level security;
alter table public.reminders enable row level security;
alter table public.templates enable row level security;


-- -----------------------------------------------------------------------------
-- 7. Policies: members
-- -----------------------------------------------------------------------------
-- Admin:       full CRUD.
-- Any member:  SELECT their own row (where user_id = auth.uid()).
-- -----------------------------------------------------------------------------

drop policy if exists members_admin_all on public.members;
create policy members_admin_all on public.members
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists members_self_select on public.members;
create policy members_self_select on public.members
  for select to authenticated
  using (user_id = (select auth.uid()));

comment on policy members_self_select on public.members is
  'Any authenticated member can read their own row. Does not expose other members.';


-- -----------------------------------------------------------------------------
-- 8. Policies: trees
-- -----------------------------------------------------------------------------
-- Admin: full CRUD.
-- Tree Keeper: SELECT + UPDATE rows whose ecoslo_num is in their
--   members.trees_assigned array. 
-- Anon: no direct access; use the public_trees view.
-- -----------------------------------------------------------------------------

drop policy if exists trees_admin_all on public.trees;
create policy trees_admin_all on public.trees
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists trees_keeper_select_assigned on public.trees;
create policy trees_keeper_select_assigned on public.trees
  for select to authenticated
  using (
    exists (
      select 1 from public.members
      where user_id = (select auth.uid())
        and trees_assigned @> array[ecoslo_num]
    )
  );

drop policy if exists trees_keeper_update_assigned on public.trees;
create policy trees_keeper_update_assigned on public.trees
  for update to authenticated
  using (
    exists (
      select 1 from public.members
      where user_id = (select auth.uid())
        and trees_assigned @> array[ecoslo_num]
    )
  )
  with check (
    exists (
      select 1 from public.members
      where user_id = (select auth.uid())
        and trees_assigned @> array[ecoslo_num]
    )
  );


-- -----------------------------------------------------------------------------
-- 9. Policies: tasks
-- -----------------------------------------------------------------------------
-- Admin: full CRUD.
-- Tree Keeper: SELECT + UPDATE tasks where their member id is in assignees.
--   The intended UX is "toggle is_complete," but RLS can't restrict columns;
--   the UI is responsible for that. To enforce at the DB level, replace the
--   UPDATE policy with a complete_task(task_id bigint) SECURITY DEFINER RPC
--   and remove this policy.
-- -----------------------------------------------------------------------------

drop policy if exists tasks_admin_all on public.tasks;
create policy tasks_admin_all on public.tasks
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists tasks_keeper_select_own on public.tasks;
create policy tasks_keeper_select_own on public.tasks
  for select to authenticated
  using (assignees @> array[public.current_member_id()]);

drop policy if exists tasks_keeper_update_own on public.tasks;
create policy tasks_keeper_update_own on public.tasks
  for update to authenticated
  using (assignees @> array[public.current_member_id()])
  with check (assignees @> array[public.current_member_id()]);


-- -----------------------------------------------------------------------------
-- 10. Policies: surveys
-- -----------------------------------------------------------------------------
-- Admin: full CRUD.
-- Tree Keeper: SELECT + INSERT for surveys whose linked task is assigned
--   to them OR whose linked tree (ecoslo_num) is assigned to them.
-- A survey with both task and tree NULL is admin-only.
-- -----------------------------------------------------------------------------

drop policy if exists surveys_admin_all on public.surveys;
create policy surveys_admin_all on public.surveys
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists surveys_keeper_select_related on public.surveys;
create policy surveys_keeper_select_related on public.surveys
  for select to authenticated
  using (
    (task is not null and exists (
      select 1 from public.tasks t
      where t.id = surveys.task
        and t.assignees @> array[public.current_member_id()]
    ))
    or
    (tree is not null and exists (
      select 1 from public.members
      where user_id = (select auth.uid())
        and trees_assigned @> array[surveys.tree]
    ))
  );

drop policy if exists surveys_keeper_insert_related on public.surveys;
create policy surveys_keeper_insert_related on public.surveys
  for insert to authenticated
  with check (
    (task is not null and exists (
      select 1 from public.tasks t
      where t.id = surveys.task
        and t.assignees @> array[public.current_member_id()]
    ))
    or
    (tree is not null and exists (
      select 1 from public.members
      where user_id = (select auth.uid())
        and trees_assigned @> array[surveys.tree]
    ))
  );


-- -----------------------------------------------------------------------------
-- 11. Policies: reminders
-- -----------------------------------------------------------------------------
-- Admin: full CRUD. No one else.
-- -----------------------------------------------------------------------------

drop policy if exists reminders_admin_all on public.reminders;
create policy reminders_admin_all on public.reminders
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());


-- -----------------------------------------------------------------------------
-- 12. Policies: templates
-- -----------------------------------------------------------------------------
-- Admin: full CRUD. No one else.
-- -----------------------------------------------------------------------------

drop policy if exists templates_admin_all on public.templates;
create policy templates_admin_all on public.templates
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());


-- -----------------------------------------------------------------------------
-- 13. Defense in depth: revoke broad table grants from anon
-- -----------------------------------------------------------------------------
-- RLS already blocks anon from these tables (no anon policies exist), but
-- revoking the grants removes them from anon's privilege catalog entirely.
-- The column-level grant on trees from section 5 is preserved.
-- -----------------------------------------------------------------------------

revoke all on public.members   from anon;
revoke all on public.trees     from anon;
revoke all on public.tasks     from anon;
revoke all on public.surveys   from anon;
revoke all on public.reminders from anon;
revoke all on public.templates from anon;
