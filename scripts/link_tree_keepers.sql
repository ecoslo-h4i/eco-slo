-- ECOSLO: backfill trees.tree_keeper_id after importing trees.csv + members.csv.
--
-- Idempotent: the `is distinct from` guard means re-running changes nothing.

update public.trees t
set tree_keeper_id = m.id
from public.members m
where t.ecoslo_num = any(m.trees_assigned)
  and t.tree_keeper_id is distinct from m.id;
