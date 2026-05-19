-- =============================================================================
-- ECOSLO: Public members view + denormalize keeper name into public_trees
-- =============================================================================
-- The map page needs to display the tree keeper's name to anonymous users.
-- Anon has no grant on the members table (section 13 of the RLS setup),
-- and PostgREST embedded joins through `tree_keeper_id` query members
-- directly — which fails.
--
-- Two parts:
--   1. A public_members view exposing non-sensitive columns.
--   2. public_trees redefined to join in keeper firstname/lastname directly,
--      so the map can read everything in one query without a FK embed.
--
-- The view is also kept available in case other public-facing pages want
-- to reference members directly.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 1. Public members view
-- -----------------------------------------------------------------------------
-- Whitelist of member columns safe for unauthenticated display. Audit
-- before adding columns; same model as public_trees.
-- -----------------------------------------------------------------------------

create or replace view public.public_members
with (security_invoker = false)
as
select
  id,
  firstname,
  lastname
from public.members;

comment on view public.public_members is
  'Whitelist of member columns safe for unauthenticated display. Confirmed with client that firstname/lastname may be public.';

grant select on public.public_members to anon, authenticated;


-- -----------------------------------------------------------------------------
-- 2. Redefine public_trees with denormalized keeper name
-- -----------------------------------------------------------------------------
-- Joins members in directly so the map can read everything in one query
-- without a PostgREST embedded select. Existing columns kept in their
-- prior order (a CREATE OR REPLACE VIEW requirement); keeper name columns
-- are appended at the end.
-- -----------------------------------------------------------------------------

create or replace view public.public_trees
with (security_invoker = false)
as
select
  t.ecoslo_num,
  t.status,
  t.condition,
  t.species_name,
  t.common_name,
  t.latitude,
  t.longitude,
  t.address,
  t.date_planted,
  t.is_public,
  t.notes,
  t.tree_keeper_id,
  t.id,
  m.firstname as tree_keeper_firstname,
  m.lastname  as tree_keeper_lastname
from public.trees t
left join public.members m on m.id = t.tree_keeper_id;