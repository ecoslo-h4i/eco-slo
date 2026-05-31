-- =============================================================================
-- ECOSLO: TaskType classification
-- =============================================================================
-- Adds a "TaskType" enum and a `type` column to templates, reminders, and
-- tasks. The type flows Template -> Reminder -> Task:
--   * A template declares its kind (Watering / Mulching / Other).
--   * A reminder created from a template inherits that kind; reminders created
--     without a template stay 'Other'.
--   * fire_reminder copies reminders.type onto every task it generates.
-- Watering/Mulching tasks drive tree status updates on completion (see the
-- fire_reminder and complete_task_survey migrations).
--
-- Also adds tasks.tree_targets: a snapshot of the ecoslo_nums a Watering/
-- Mulching task covers, captured by fire_reminder at fire time. It is the
-- authoritative per-task tree list — driving completion (one survey per
-- target), the survey checklist UX, and the "most recent task for this tree"
-- recency guard — and is intentionally NOT re-derived if a member's
-- assignment changes mid-cycle.
--
-- Existing rows backfill to 'Other' / NULL via the column defaults, which is
-- the correct, behavior-preserving state for anything created before typing
-- existed.
-- =============================================================================

create type "public"."TaskType" as enum ('Watering', 'Mulching', 'Other');

alter table "public"."templates"
  add column "type" "public"."TaskType" not null default 'Other';

alter table "public"."reminders"
  add column "type" "public"."TaskType" not null default 'Other';

alter table "public"."tasks"
  add column "type" "public"."TaskType" not null default 'Other';

alter table "public"."tasks"
  add column "tree_targets" bigint[];

-- Accelerates the recency guard's `tree_targets @> array[tree]` containment
-- check in complete_task_survey.
create index if not exists "tasks_tree_targets_gin"
  on "public"."tasks" using gin ("tree_targets");

comment on column "public"."templates"."type" is
  'Classification of reminders built from this template (Watering/Mulching/Other).';

comment on column "public"."reminders"."type" is
  'Classification copied from the source template, or Other when none. Propagated to tasks at fire time.';

comment on column "public"."tasks"."type" is
  'Copied from the parent reminder. Watering/Mulching completions update the related tree status.';

comment on column "public"."tasks"."tree_targets" is
  'Snapshot (at fire time) of the tree ecoslo_nums a Watering/Mulching task covers. Authoritative per-task tree list; NULL for Other tasks.';
