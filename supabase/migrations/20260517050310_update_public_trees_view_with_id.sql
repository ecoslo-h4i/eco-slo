-- =============================================================================
-- ECOSLO: Add id to public_trees view
-- =============================================================================
-- Adds id to the public_trees view's column list. Confirmed
-- with the client that exposing this field is acceptable.
--
-- Append-only: the existing columns are listed in their original order
-- (a requirement of CREATE OR REPLACE VIEW), and tree_keeper_id is added
-- at the end.
-- =============================================================================

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
  notes,
  tree_keeper_id,
  id
from public.trees;