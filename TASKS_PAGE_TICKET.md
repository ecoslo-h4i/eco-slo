# Tasks Page Consolidation

## Summary

Build the Tasks page as the single internal workflow for viewing, creating, filtering, completing, and surveying one-off tasks. The current standalone Survey page should be removed from the internal user experience, and its survey submission flow should be migrated into task detail modals on the Tasks page.

The Tasks page should use a card/list experience, not a table. Users should browse full-width task cards, open a task into a view-only detail modal, and complete any required survey from that modal without leaving the page.

## Current State

- The Tasks page already exists at `/tasks`.
- Tasks are currently fetched from `public.tasks` with Supabase RLS handling role-based visibility.
- The page currently renders task cards with a top control panel.
- Filtering/searching exists in a lo-fi form.
- Cards are display-only.
- There is no Add Task flow.
- There is no CSV export flow.
- There is no task detail modal.
- There is no completion action.
- Survey completion currently lives on a separate Survey page.
- Survey submission currently does not update task completion state.

## Primary Goal

Replace the boilerplate Tasks experience with a complete card-based task management workflow:

- Admins can view, create, filter, export, and complete tasks.
- Tree Keepers can view and complete only tasks assigned to them.
- Survey-gated tasks can be completed from a modal inside the Tasks page.
- The standalone internal Survey page is removed from navigation and no longer used as a separate workflow.

## Data Model

Use `public.tasks` as the source of truth.

Relevant task fields:

- `id`
- `created_at`
- `message`
- `title`
- `assignees`
- `is_complete`
- `completion_date`
- `survey_mode`
- `survey_required_count`
- `surveys_needed`
- `tree_targets`
- `created_by`

Use `survey_mode` as the source of truth for survey availability and gating.

Display this to users as:

- `No Survey` when `survey_mode = none`
- `Survey Available` when `survey_mode = optional`
- `Survey Required` when `survey_mode = required`

## Access Rules

### Admins

- Can view all tasks.
- Can create new tasks.
- Can mark tasks as complete.
- Can search, sort/order, and filter tasks.
- Can export task data.

### Tree Keepers

- Can only view tasks where their member ID is included in the task `assignees` array.
- Can view both directly assigned tasks and shared group tasks that include them.
- Can mark visible tasks as complete.
- Can complete required surveys for visible tasks.
- Cannot create tasks.
- Cannot edit tasks.

### Public Users

- No access to the Tasks page.
- No access to internal task workflows.

## UI Direction

Do not implement the task view as a table.

Use a card/list layout:

- Full-width task cards/list rows.
- Cards should be easy to scan.
- Clicking a card opens a view-only task detail modal.
- Group tasks should visually communicate that completion is shared across all assignees.
- Completed tasks should appear visually muted when shown.

## Header Actions

### Export CSV

Add an `Export CSV` button.

Clicking the button opens a small modal with two options:

- Export all tasks in the database.
- Export only the currently visible tasks after search and filters are applied.

### Add Task

Add an `Add Task` button for admins only.

Clicking the button opens a modal with:

- Message field.
- Assignees multi-select member picker.
- Linked trees multi-select sourced from the selected assignees' assigned trees.
- Survey mode selector: No Survey / Optional Survey / Required Survey.
- Required survey count input when Survey Required is selected.

Save behavior:

- Creates a new task with:
  - `id`
  - `created_at`
  - `message`
  - `assignees`
  - `is_complete = false`
  - `completion_date = null`
  - `survey_mode`
  - `survey_required_count`
  - `surveys_needed = survey_required_count` only for required survey tasks
  - `tree_targets` set to linked tree `ecoslo_num` values, or null
  - `created_by` set to the current admin member ID when available

Cancel behavior:

- Closes the modal.
- Creates nothing.

Tree Keepers should not see the Add Task button.

## Control Panel

### Search

Add fuzzy search across visible task fields, including:

- Message
- Title, if retained
- Assignee names
- Task ID
- Survey/completion labels where useful

### Status Filter

Provide status controls for:

- Open
- Completed

Default view should be Open only.

Completed tasks should be hidden by default.

### Assignee Filter

Admin only.

Allow filtering by one or multiple assignees.

Tree Keepers should not need this filter because their task set is already scoped by RLS and product rules.

### Survey Filter

Provide survey controls for:

- All
- No Survey
- Survey Available
- Survey Required

This filter must use `survey_mode`, not `surveys_needed` or `is_complete`.

## Task Cards

Each task card should show:

- Message
- Assignee names
- Survey mode status
- Created date
- Completion state
- Completion date when completed
- Group/shared indicator when multiple assignees are present

The card should have no edit affordance.

## Task Detail Modal

Clicking a task card opens a view-only task detail modal.

The modal should show:

- Task ID
- Message
- Assignees
- Survey mode status
- Created date
- Completion status
- Completion date, if complete
- Shared/group task explanation when multiple assignees are present

No edit action should be available.

Tasks should not be editable after creation.

## Completion Behavior

Show a Complete action to Admins and Tree Keepers when:

- The task is visible to the user.
- The task is not already complete.

### Tasks Without Required Surveys

If `survey_mode = none` or `survey_mode = optional`:

- Clicking Complete immediately marks the task complete.
- Set `is_complete = true`.
- Set `completion_date` to the current timestamp.
- Optional-survey tasks also show a separate `Submit Survey` action.

### Tasks With Survey Requirements

If `survey_mode = required` and `surveys_needed > 0`:

- Do not complete the task immediately.
- Show the task-scoped survey form in the task detail modal.
- The user should not leave the Tasks page.
- The task ID should be passed automatically from the opened task.
- The user should not manually choose a task in the survey form.

When the survey is submitted successfully:

- Create a `surveys` row tied to the current task.
- Resolve the task's required survey progress.
- When the requirement is satisfied, set:
  - `is_complete = true`
  - `completion_date = now()`

The task should not be marked complete unless a valid survey exists for that task.

## Group Task Behavior

Tasks assigned to multiple users remain one shared task object.

Do not duplicate tasks per assignee.

If any assigned user completes a group task, the task becomes complete for the whole group.

This is not per-user completion.

The card and modal should make this clear so users understand that completing a shared task removes it from the open list for every assigned user.

## Survey Page Migration

Remove the standalone internal Survey page workflow.

Tasks should become the place where task-related surveys are completed.

Required changes:

- Remove the Survey item from the internal sidebar navigation.
- Reuse or migrate the existing survey form components into a task-scoped modal flow.
- Remove task selection from the survey form when used from Tasks.
- Bind survey submission to the currently opened task.
- Preserve the rest of the relevant survey fields where practical:
  - Tree selector
  - Issue type
  - Other issue description
  - Image link
  - Notes
  - Admin contact checkbox
- Resolve the current survey TODO where successful survey submission does not yet update the related task.

If public survey routes or legacy API endpoints are still needed, they can remain as implementation details, but they should not be exposed as a separate internal navigation destination.

## Pagination

Add footer controls for the task list:

- Tasks per page selector.
- Text like `Showing x of y tasks`.
- Previous button.
- Next button.

Pagination should apply to the filtered result set.

## Completed Task Retention

Completed tasks should remain in the database for up to one month after completion.

After one month, completed tasks should expire and be removed from the database.

If scheduled cleanup is too large for this ticket, create a follow-up ticket for backend cleanup.

## Out of Scope

- Task editing after creation.
- Per-user completion for group tasks.
- Recurring reminders.
- Reminder templates.
- Reminder-generated task workflows unless already supported by existing backend behavior.

Reminders and templates should remain separate and live on the Reminders page. Do not modify the Reminders page or any of its functionality and related logic.

## Acceptance Criteria

- Tasks page uses a card/list layout, not a table.
- Admins can view all tasks.
- Admins can create tasks.
- Admins can complete visible open tasks.
- Admins can export all tasks or currently filtered tasks.
- Tree Keepers only see tasks assigned to them, including shared tasks where their member ID is in `assignees`.
- Tree Keepers can complete visible open tasks.
- Tree Keepers cannot create tasks.
- Tree Keepers cannot edit tasks.
- Public users cannot access the Tasks page.
- Open tasks are shown by default.
- Completed tasks are hidden by default.
- Search works across visible task fields.
- Status filtering works for Open and Completed.
- Survey filtering works from `surveys_needed`.
- Admin assignee filtering supports multiple selected assignees.
- Clicking a task opens a view-only detail modal.
- No edit action exists on cards or in the modal.
- Non-survey tasks complete immediately when Complete is clicked.
- Survey-gated tasks open a task-scoped survey flow in the modal.
- Survey-gated tasks are not completed until a valid survey exists for that task.
- Successful survey submission updates the related task completion state.
- Group tasks complete as one shared task object.
- Survey page is removed from internal navigation.

## Development Guidelines

- Reuse code and components as much as possible, many features and components needed in the task page can be copied over from other pages and components and used/modified
- All frontend work and styling must remian consistent with the design of the app and the design tokens in globals.css
