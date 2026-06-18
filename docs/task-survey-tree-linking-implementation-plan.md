# Task Survey Modes and Tree Linking Implementation Plan

## Purpose

Implement a more flexible task survey model for ECOSLO tasks:

- Tasks can have no survey, optional surveys, or required surveys.
- Optional-survey tasks can be completed without submitting a survey.
- Required-survey tasks keep the existing gated completion behavior.
- Tasks can be explicitly linked to one or more trees, independent of whether surveys are required.
- Linked trees are immutable after task creation.
- Surveys may still be submitted against completed tasks until the existing cleanup process removes or detaches old completed tasks.
- Survey submissions must continue logging to the linked task and tree records.

This plan is handoff-ready for another implementation agent. It reflects the current repo structure and the product decisions made during planning.

## Current State Summary

The app is a Next.js App Router project with Supabase/Postgres.

Primary task files:

- `src/app/(admin)/tasks/page.tsx`
- `src/components/TaskCard.tsx`
- `src/components/TaskDetailModal.tsx`
- `src/components/TasksControlPanel.tsx`
- `src/components/ExportCSVModal.tsx`
- `src/components/survey/TaskSurveyForm.tsx`

Primary APIs:

- `src/app/api/admin/tasks/route.ts`
- `src/app/api/admin/tasks/[id]/route.ts`
- `src/app/api/public/surveys/route.ts`
- `src/app/api/public/tasks/[id]/survey-progress/route.ts`
- `src/app/api/public/survey/trees/route.ts`

Primary database logic:

- `supabase/migrations/20260529000000_add_task_type.sql`
- `supabase/migrations/20260529000001_fire_reminder_typed.sql`
- `supabase/migrations/20260529000002_complete_task_survey_typed.sql`
- `supabase/migrations/20260531000000_get_pending_email_jobs_variables.sql`
- `supabase/migrations/20260531000001_surveys_submitted_by.sql`

Important current behavior:

- `tasks.surveys_needed > 0` currently means a survey is required before completion.
- `TaskDetailModal` uses `surveys_needed > 0` to show `Complete Survey` instead of `Mark Complete`.
- `TaskSurveyForm` treats Watering/Mulching as per-tree required survey flows.
- `complete_task_survey(p_task_id, p_tree)` decrements survey requirements and completes tasks.
- `tasks.tree_targets` already stores tree `ecoslo_num` values for Watering/Mulching reminders and message variables.
- `trees.survey_logs` exists in generated types and tree detail UI reads it, but the current explicit write path that appends new survey IDs to `trees.survey_logs` was not found during audit. Implement this explicitly.

## Product Decisions

Use three survey modes:

- `none`: no survey should be shown or expected.
- `optional`: surveys are available but never block task completion.
- `required`: surveys block task completion until the required count is satisfied.

Completion rules:

- `none`: task can be marked complete immediately.
- `optional`: task can be marked complete immediately; survey submission remains available after completion until cleanup.
- `required`: task cannot be manually marked complete until enough valid required surveys have been submitted.

Tree-linking rules:

- A task can link zero, one, or many trees.
- Linked trees are stored on `tasks.tree_targets`.
- Linked trees are immutable after task creation.
- When creating a task, selectable linked trees are the union of trees owned by selected assignees.
- A task can also intentionally have no linked trees.
- For Watering/Mulching reminders, linked trees default to the assignee's currently owned trees, as they do today.
- For manually created Watering/Mulching tasks, default to required surveys when linked trees exist, but admins should be able to choose optional.

Required survey counting:

- If a required task has linked trees, only one survey per linked tree counts toward completion.
- Duplicate surveys for the same task/tree are allowed for logging, but must not decrement `surveys_needed` more than once.
- If a required task has linked trees, the required count should default to the linked tree count and should not exceed linked tree count.
- If a required task has no linked trees, allow a manual required count, defaulting to `1`.

Post-completion survey behavior:

- Tasks should still accept optional/logging surveys after completion until cleanup.
- Required tasks that are already complete should also accept additional surveys for logging.
- Cleanup currently detaches surveys from stale completed tasks before deleting tasks. Preserve that behavior unless product explicitly changes it.

## Recommended Data Model

Add a survey mode column. Prefer a Postgres enum for type safety.

```sql
create type public."TaskSurveyMode" as enum ('none', 'optional', 'required');

alter table public.tasks
  add column survey_mode public."TaskSurveyMode" not null default 'none';

alter table public.tasks
  add column survey_required_count integer not null default 0;
```

Continue using:

- `tasks.surveys_needed`: remaining required survey count.
- `tasks.tree_targets`: immutable linked tree `ecoslo_num` values.

Suggested constraints:

```sql
alter table public.tasks
  add constraint tasks_survey_counts_nonnegative
  check (surveys_needed >= 0 and survey_required_count >= 0);

alter table public.tasks
  add constraint tasks_survey_mode_counts_consistent
  check (
    (survey_mode in ('none', 'optional') and surveys_needed = 0 and survey_required_count = 0)
    or
    (survey_mode = 'required' and survey_required_count >= 1 and surveys_needed >= 0)
  );
```

Because the user plans to nuke the database, no historical backfill compatibility is required. Still set explicit defaults so seed/new rows behave safely.

Update generated Supabase types after migrations.

## Database Function Changes

### `complete_task_survey`

Replace the current behavior with survey-mode-aware logic.

Responsibilities:

- Authorize that caller is an admin or task assignee.
- Do not reject completed tasks for survey logging.
- Do not auto-complete optional tasks.
- For `required`, decrement completion progress only if a new counted survey is valid.
- For required linked-tree tasks, count distinct surveyed linked trees.
- For duplicate surveys on the same task/tree, allow the survey row to exist but do not decrement again.
- For required no-linked-tree tasks, decrement by one per survey until zero.
- Complete the task only when `surveys_needed` reaches `0`.

Important: the function is currently called after inserting the survey row, so it can inspect existing surveys. If duplicate survey rows are allowed, count distinct trees rather than relying only on inserted row count.

### New `complete_task` RPC

Add a dedicated completion RPC instead of letting the client update task rows directly.

Responsibilities:

- Authorize admin or assignee.
- If task is already complete, return cleanly.
- If `survey_mode = 'required'` and `surveys_needed > 0`, reject or no-op.
- Otherwise set:
  - `is_complete = true`
  - `completion_date = now()`
- For Watering/Mulching tasks with linked trees, update tree maintenance status to Completed when the task is completed, using the same recency guard currently in `complete_task_survey`.

This makes completion independent of whether a survey was submitted while preserving required gating.

### Survey-to-tree logging

Explicitly append survey IDs to `trees.survey_logs`.

Preferred implementation: a DB trigger on `surveys` insert.

Behavior:

- If `new.tree is null`, do nothing.
- If `new.tree is not null`, append `new.id` to the matching `trees.survey_logs`.
- Avoid duplicate IDs if the trigger is rerun.

Example shape:

```sql
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
```

## Reminder Generation Changes

Update `fire_reminder` in `supabase/migrations/20260529000001_fire_reminder_typed.sql`.

Watering/Mulching:

- Continue creating one task per assignee.
- Continue snapshotting current owned trees into `tree_targets`.
- Default:
  - `survey_mode = 'required'`
  - `survey_required_count = tree_count`
  - `surveys_needed = tree_count`
- Allow reminder configuration to eventually choose optional if reminder UI supports it.

Other reminders:

- If reminder has no survey:
  - `survey_mode = 'none'`
  - `survey_required_count = 0`
  - `surveys_needed = 0`
- If reminder has optional survey:
  - `survey_mode = 'optional'`
  - `survey_required_count = 0`
  - `surveys_needed = 0`
- If reminder has required survey:
  - `survey_mode = 'required'`
  - `survey_required_count = configured count`
  - `surveys_needed = configured count`

The existing `reminders.needs_survey boolean` cannot represent optional vs required. Add reminder/template survey mode fields in the same migration if recurring tasks need the same flexibility now.

Recommended:

- Add `templates.survey_mode`
- Add `templates.survey_required_count`
- Add `reminders.survey_mode`
- Add `reminders.survey_required_count`
- Leave `needs_survey` only for backward compatibility during transition, or remove it if database reset makes compatibility unnecessary.

## API Changes

### Admin task POST

File: `src/app/api/admin/tasks/route.ts`

Current route trusts the request body as `TablesInsert<"tasks">`. Replace with validation and whitelisting.

Validate:

- `title`: required non-empty string.
- `message`: string, allow empty.
- `assignees`: number array.
- `survey_mode`: `none | optional | required`.
- `survey_required_count`: number, required only for `required`.
- `tree_targets`: number array or null.
- `type`: `Watering | Mulching | Other`, if manual task type selection is supported.

Tree validation:

- Fetch selected trees from `trees`.
- Ensure every selected tree has `tree_keeper_id` in selected assignees.
- Reject invalid trees.
- Normalize/sort/dedupe `tree_targets`.

Survey count validation:

- `none`: force `surveys_needed = 0`, `survey_required_count = 0`.
- `optional`: force `surveys_needed = 0`, `survey_required_count = 0`.
- `required` with linked trees:
  - `survey_required_count` must be `1..tree_targets.length`.
  - `surveys_needed = survey_required_count`.
- `required` with no linked trees:
  - `survey_required_count >= 1`.
  - Choose a reasonable max, e.g. `10`, matching the current UI max.
  - `surveys_needed = survey_required_count`.

### Admin task PUT

File: `src/app/api/admin/tasks/[id]/route.ts`

Linked trees must be immutable.

Rules:

- Do not allow updates to `tree_targets` after creation.
- Do not allow updates to `survey_mode`, `survey_required_count`, or `surveys_needed` after creation unless product later adds a controlled admin-only edit flow.
- For normal edit, allow only title/message/assignees if current UI still edits assignees.
- Consider making assignees immutable too if changing assignees would make immutable linked trees inconsistent. Safer option: for tasks with `tree_targets`, do not allow assignee changes after creation.

### Task completion endpoint

Use the new `complete_task` RPC from the modal completion action.

Avoid direct client updates like:

```ts
{ is_complete: true, completion_date: new Date().toISOString() }
```

### Survey submit route

File: `src/app/api/public/surveys/route.ts`

Current route rejects completed Watering/Mulching tasks and rejects duplicate tree surveys. Change this.

New behavior:

- Load task with `id, type, is_complete, tree_targets, survey_mode, surveys_needed`.
- If task has linked trees:
  - Require `tree` for survey submission.
  - Ensure selected tree is in `tree_targets`.
- If task has no linked trees:
  - Allow `tree = null`.
  - Optionally allow a tree only if it belongs to one of the assignees.
- Do not reject completed tasks.
- Do not reject duplicate task/tree surveys.
- Insert survey.
- Call `complete_task_survey` only to update required survey progress. It should no-op for optional/none modes.

## UI Changes

### Task create modal

File: `src/components/TaskDetailModal.tsx`

Replace `Surveys Needed` numeric field with:

- Survey mode segmented control:
  - `No Survey`
  - `Optional Survey`
  - `Required Survey`
- Required count numeric input shown only for `Required Survey`.
- Linked trees multiselect.

Linked tree picker behavior:

- Disabled until at least one assignee is selected.
- Options are trees whose `tree_keeper_id` is one of selected assignees.
- If assignees change, remove selected linked trees that are no longer valid.
- Allow no selected trees.
- Display selected tree labels as `#<ecoslo_num> - <common_name/species_name>`.

Suggested defaults:

- Manual Other task: `survey_mode = none`, no linked trees.
- Manual Watering/Mulching task: default linked trees to selected assignees' owned trees and `survey_mode = required`.
- If linked trees exist and survey mode switches to Required, default required count to linked tree count.

### Task detail modal

Update action buttons:

- If open and `survey_mode = none`: show `Mark Complete`.
- If open and `survey_mode = optional`: show `Mark Complete` and secondary `Submit Survey`.
- If complete and `survey_mode = optional`: show `Submit Survey`.
- If required and `surveys_needed > 0`: show `Complete Required Survey`.
- If required and `surveys_needed = 0` but task not complete due to edge case: show `Mark Complete`.
- If complete and required: optionally show `Submit Additional Survey` for logging.

Update badges:

- Replace `Needs Survey` copy with:
  - `Survey Available` for optional.
  - `Survey Required` for required.
  - `No Survey` for none.

### Task card

File: `src/components/TaskCard.tsx`

Replace current `needsSurvey = surveys_needed > 0` logic with `survey_mode`.

Show:

- `Survey Available` badge for optional.
- `Survey Required` badge for required while incomplete or while still needing surveys.
- Optional: include `N remaining` for required tasks.

### Task filters

File: `src/components/TasksControlPanel.tsx`

Replace survey filter options:

- `All`
- `No Survey`
- `Survey Available`
- `Survey Required`

Filter against `survey_mode`, not `surveys_needed`.

### Dashboard

File: `src/app/(admin)/dashboard/page.tsx`

Replace “Needs Survey” / “Awaiting Survey” count.

Suggested stats:

- `Survey Required`: open tasks where `survey_mode = required` and `surveys_needed > 0`.
- `Survey Available`: tasks where `survey_mode = optional`.

Avoid implying optional surveys are blocking.

### CSV export

File: `src/components/ExportCSVModal.tsx`

Replace `needs_survey` column with:

- `survey_mode`
- `survey_required_count`
- `surveys_remaining`
- `linked_trees`

### Survey form

File: `src/components/survey/TaskSurveyForm.tsx`

Update labels:

- Header should not always say `Complete Survey`; use:
  - `Submit Survey`
  - `Required Survey`
  - `Additional Survey`

Tree dropdown:

- For linked-tree tasks, use task-linked trees, not all RLS-visible trees.
- For no-linked-tree tasks, allow no tree.
- Do not hide already-surveyed trees for optional/additional surveys.
- For required linked-tree tasks, visually show required progress, but still allow additional surveys after completion.

## Public/Shared Survey Routes

`src/app/api/public/tasks/[id]/survey-progress/route.ts` currently returns progress from `tree_targets` and existing surveys.

Update it to return:

- `survey_mode`
- `surveys_needed`
- `survey_required_count`
- linked trees
- for each tree:
  - whether it has at least one counted survey
  - total survey count for logging display

For required linked-tree tasks, counted means “at least one survey exists for this task/tree.”

## Message Variables and Email

`src/lib/task-message-variables.ts` and `supabase/migrations/20260531000000_get_pending_email_jobs_variables.sql` already use `tree_targets` for `{treeCount}` and `{treeNames}`.

Keep that behavior. It aligns with explicit linked trees.

If linked trees are now allowed for Other tasks, this is desirable: task messages can reference the explicitly linked trees instead of falling back to assignee current trees.

## RLS and Security Considerations

Current task RLS allows assignees to update visible tasks. The existing comments note this is broad.

Recommended hardening:

- Move task completion to `complete_task` RPC.
- Narrow or remove direct task update capability for tree keepers if feasible.
- At minimum, API/UI should never expose arbitrary task update payloads.
- Admin task routes should whitelist fields.
- Survey route should enforce task/tree relation server-side.

## Documentation Updates

Update docs that currently state surveys are strictly required/gating:

- `TASKS_PAGE_TICKET.md`
- `SPECDOC.md`
- `docs/supabase-architecture.md`
- `docs/ECOSLO Handoff Product Documentation.md`
- `docs/documentation-feedback-report.md`

Key terminology replacement:

- Replace generic “Needs Survey” with:
  - “Survey Available” for optional
  - “Survey Required” for required

## Suggested Implementation Phases

### Phase 1: Schema and DB behavior

- Add `TaskSurveyMode`.
- Add `survey_mode` and `survey_required_count` to tasks.
- Add matching fields to reminders/templates if recurring reminders need the new options immediately.
- Update `complete_task_survey`.
- Add `complete_task`.
- Add survey-to-tree-log trigger.
- Update `fire_reminder`.
- Regenerate Supabase types.

### Phase 2: API validation

- Harden admin task create/update routes.
- Add tree option endpoint or reuse existing tree queries with proper fields.
- Update survey submit route.
- Update survey progress route.
- Switch task completion UI/API to `complete_task`.

### Phase 3: Task UI

- Add survey mode selector.
- Add assignee-driven linked-tree picker.
- Enforce immutable linked trees by not rendering edit controls after create.
- Update task badges, modal actions, filters, and labels.
- Update CSV export.
- Update dashboard stats.

### Phase 4: Reminder UI

- Update reminder/template forms to represent no/optional/required surveys.
- Default Watering/Mulching to required.
- Allow editing Watering/Mulching to optional before reminder save if desired.

### Phase 5: QA and docs

- Update docs.
- Run lint/build.
- Test manual task creation for each survey mode.
- Test Watering/Mulching reminder-generated tasks.
- Test optional survey after completion.
- Test required duplicate survey does not decrement twice.
- Test `trees.survey_logs` receives submitted survey IDs.

## Acceptance Criteria

- Admin can create a task with no surveys and complete it directly.
- Admin can create a task with optional surveys and complete it directly.
- Optional-survey tasks show “Survey Available,” not “Needs Survey.”
- Optional-survey tasks accept surveys before and after completion.
- Admin can create a task with required surveys and a required count.
- Required tasks cannot be completed until required surveys are satisfied.
- Required linked-tree tasks count only one survey per linked tree.
- Duplicate task/tree surveys are stored but do not reduce required count again.
- Linked trees are selected only from trees owned by assigned members.
- Linked trees can be empty.
- Linked trees are immutable after task creation.
- Survey submission for linked-tree tasks can only target linked trees.
- Survey submission appends the survey ID to the target tree's `survey_logs`.
- Watering/Mulching tasks default to required surveys but can be configured optional before creation.
- Dashboard, filters, badges, and CSV export use the new terminology and state.
- Existing cleanup behavior still allows completed tasks to receive surveys until cleanup runs.

## Open Implementation Notes

- Because the database will be reset, compatibility migrations for existing task data are not required.
- Still make migration defaults sane because local/dev seeds may omit new fields.
- Consider whether assignees should also be immutable for tasks with linked trees. This is safer because tree availability is based on assignees at creation time.
- If keeping editable assignees, do not let edits invalidate existing immutable linked trees.
- If recurring reminders get the new survey modes, remove or deprecate `needs_survey` to avoid two sources of truth.
