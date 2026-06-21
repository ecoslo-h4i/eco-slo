-- ECOSLO: one-off cleanup of seed/demo trees before importing the customer's
-- Tree Planting Log data.
--
-- The live trees table currently holds 40 seed/demo rows ("Oak", "Wood",
-- "test species", and a bulk-seeded #1001-1030 block). The customer's real
-- trees reuse ecoslo_num #1001-1030, and ecoslo_num is UNIQUE, so those 30 real
-- trees cannot import until the seed rows are removed. This deletes exactly the
-- 40 seed rows that exist today.
--
-- CASCADES & SIDE EFFECTS (verified against the live DB on 2026-06-19):
--   * public.surveys.tree -> trees.ecoslo_num is ON DELETE CASCADE, so deleting
--     these trees also deletes 23 seed surveys attached to them.
--   * public.members.trees_assigned and public.tasks.tree_targets are plain
--     bigint[] arrays (no FK), so they are NOT auto-cleaned. 12 members and 14
--     tasks reference these seed numbers; steps 2 and 3 below scrub those now-
--     dangling references. Remove steps 2/3 if you would rather leave them.
--
-- Re-running is safe: a second run deletes 0 trees and scrubs 0 arrays.

begin;

-- The exact 40 seed ecoslo_num values present in the table today.
create temporary table _seed_nums on commit drop as
select unnest(
  array[67, 677, 8001, 8002, 8003, 9001, 9002, 9003, 20000, 123456789]
  || array(select generate_series(1001, 1030))
)::bigint as num;

-- Optional pre-flight check -- preview impact before deleting:
select
  (select count(*) from public.trees   where ecoslo_num in (select num from _seed_nums)) as trees_to_delete,
  (select count(*) from public.surveys where tree      in (select num from _seed_nums)) as surveys_cascaded,
  (select count(*) from public.members where trees_assigned && array(select num from _seed_nums)) as members_to_scrub,
  (select count(*) from public.tasks   where tree_targets  && array(select num from _seed_nums)) as tasks_to_scrub;

-- 1) Delete the seed trees (cascades to their seed surveys).
delete from public.trees
where ecoslo_num in (select num from _seed_nums);

-- 2) Scrub dangling seed references out of members.trees_assigned and keep
--    trees_count consistent with the trimmed array.
update public.members m
set trees_assigned = nullif(cleaned.arr, '{}'),
    trees_count    = coalesce(array_length(cleaned.arr, 1), 0)
from (
  select id,
         array(select x from unnest(trees_assigned) as x
               where x not in (select num from _seed_nums)) as arr
  from public.members
  where trees_assigned && array(select num from _seed_nums)
) cleaned
where m.id = cleaned.id;

-- 3) Scrub dangling seed references out of tasks.tree_targets.
update public.tasks t
set tree_targets = nullif(cleaned.arr, '{}')
from (
  select id,
         array(select x from unnest(tree_targets) as x
               where x not in (select num from _seed_nums)) as arr
  from public.tasks
  where tree_targets && array(select num from _seed_nums)
) cleaned
where t.id = cleaned.id;

commit;
