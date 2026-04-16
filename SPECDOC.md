# ECOSLO Platform Product Specification

**Version:** Spring 2026 Developer Reference  
**Last updated:** 2026-04-01

---

## Table of Contents

- [Document Purpose](#document-purpose)
- [Product Overview](#product-overview)
- [Primary Product Goals](#primary-product-goals)
- [User Roles](#user-roles)
- [Current Database Schema](#current-database-schema)
  - [Enums](#enums)
  - [Table: `public.trees`](#table-publictrees)
  - [Table: `public.members`](#table-publicmembers)
  - [Table: `public.tasks`](#table-publictasks)
  - [Table: `public.surveys`](#table-publicsurveys)
  - [Table: `public.reminders`](#table-publicreminders)
  - [Table: `public.templates`](#table-publictemplates)
  - [Relationship Summary](#relationship-summary)
- [Product Logic Clarifications](#product-logic-clarifications)
  - [Tasks are one-off only](#1-tasks-are-one-off-only)
  - [Survey-gated task completion uses `surveys_needed`](#2-survey-gated-task-completion-uses-surveys_needed)
  - [Survey data is stored in `surveys.body`](#3-survey-data-is-stored-in-surveysbody)
  - [Members replaces Volunteers](#4-members-replaces-volunteers)
  - [Trees use both `status` and `condition`](#5-trees-use-both-status-and-condition)
  - [Reminders and Templates are schema-driven first](#6-reminders-and-templates-are-schema-driven-first)
- [Page Specifications](#page-specifications)
  - [Trees Page](#trees-page)
  - [Members Page](#members-page)
  - [Tasks Page](#tasks-page)
  - [Reminders Page](#reminders-page)
  - [Survey Page](#survey-page)
  - [Public Map Page](#public-map-page)
  - [Login / Auth Pages](#login--auth-pages)
  - [Dashboard Page](#dashboard-page)
- [Reminder and Survey Operational Intent](#reminder-and-survey-operational-intent)
- [Tree Lifecycle Intent](#tree-lifecycle-intent)
- [Export / Search / Filtering Expectations](#export--search--filtering-expectations)
- [Known Source-of-Truth Decisions](#known-source-of-truth-decisions)
- [Suggested Developer Interpretation Guidelines](#suggested-developer-interpretation-guidelines)

---

## Document Purpose

This document is the comprehensive product and implementation reference for the ECOSLO platform. It consolidates the original Spring MVP planning document, earlier sprint planning notes, and clarified product decisions discussed by the tech leads.

This document is intended for developers building the platform during Spring quarter.

### What this document prioritizes

- The **current database schema** is the source of truth for data modeling.
- The **product requirements** from the original PRD remain the source of truth for intended behavior.
- Where the original PRD and the current schema differ, this document resolves the discrepancy in favor of the **current schema**, while noting intended product behavior.
- UI mockups and early Figma designs are helpful references, but they are **not** the primary source of truth.

---

## Product Overview

ECOSLO is a nonprofit that plants trees and maintains them around San Luis Obispo. The platform being built for ECOSLO is intended to centralize operations that are currently spread across manual processes and disconnected systems.

The platform should allow ECOSLO to:

- manage tree records
- manage members and tree keepers
- view a public tree map
- assign and track one-off tasks
- define recurring reminders
- collect surveys tied to tasks and trees
- provide a dashboard and operational workflows for admins

The platform supports both internal operations and public-facing map functionality.

---

## Primary Product Goals

The platform should eventually support the following operational areas:

1. **Trees management**
   - create, view, edit, and delete tree records
   - search, filter, sort, and export tree data
   - manage tree status, condition, notes, maintenance-related data, and tree keeper assignments

2. **Members management**
   - manage members and their contact information
   - distinguish between admins and tree keepers
   - track assigned trees

3. **Public tree map**
   - expose public tree data only
   - allow public browsing of visible trees
   - support simple tree information viewing and issue-report workflows

4. **Tasks system**
   - manage one-off operational tasks
   - assign tasks to one or more members
   - track completion status
   - support survey-gated completion

5. **Reminders system**
   - define recurring reminders
   - generate recurring task-like workflows from reminder definitions
   - support admin workflows for scheduling and management

6. **Survey collection**
   - capture tree- and task-specific survey submissions
   - support maintenance/status reporting tied to specific trees
   - support task completion requirements where surveys are needed

7. **Dashboard and internal operations**
   - provide an admin-facing overview of tasks, reminders, and tree activity
   - surface operational priorities and recent activity

---

## User Roles

The platform currently recognizes three product-level user groups.

### 1. Admin

Admins can manage internal operations.

Expected capabilities:

- see and edit all internal data
- manage trees
- manage members
- create and manage tasks
- create and manage reminders
- view and manage surveys
- access internal dashboard pages

### 2. Tree Keeper

Tree Keepers are members who are responsible for one or more trees.

Expected capabilities:

- view tasks relevant to them
- complete visible tasks
- submit surveys related to assigned work
- view or update tree-related information that product rules permit

### 3. Public

Public users are not authenticated internal users.

Expected capabilities:

- access the public tree map
- view public tree information only
- no access to internal admin/member/task/reminder workflows

> Terminology note: this document uses **Members** and **Tree Keepers** consistently. Older planning materials used the term **Volunteers**. Treat that wording as legacy terminology.

---

## Current Database Schema

The following sections reflect the **current database schema** and should be treated as the implementation source of truth.

## Enums

### `TreeStatus`

- `Active`
- `Graduated`

### `WateringStatus`

- `Completed`
- `Pending`

### `MulchingStatus`

- `Completed`
- `Pending`

### `Condition`

- `good`
- `fair`
- `poor`

### `MemberType`

- `Admin`
- `Tree Keeper`

---

## Table: `public.trees`

Represents all trees managed by ECOSLO.

### Columns

- `id`: bigint, primary key
- `created_at`: timestamptz, defaults to `now()`
- `status`: `TreeStatus`, defaults to `Active`
- `ecoslo_num`: bigint, unique identity value
- `species_name`: text
- `common_name`: text
- `funder`: text
- `date_planted`: date
- `address`: text
- `latitude`: float8
- `longitude`: float8
- `is_public`: boolean, defaults to `false`
- `weekly_watering_status`: `WateringStatus`, defaults to `Pending`
- `next_mulching_date`: date, nullable
- `notes`: text, nullable, defaults to empty string
- `condition`: `Condition`, defaults to `good`
- `next_watering_date`: date, nullable
- `yearly_mulching_status`: `MulchingStatus`, defaults to `Pending`
- `admin_notes`: text, defaults to empty string
- `survey_logs`: bigint[], nullable
- `tree_keeper_id`: bigint, nullable, foreign key to `members.id`

### Relationships

- `trees.tree_keeper_id -> members.id`
- `surveys.tree -> trees.ecoslo_num`

### Product meaning

- `status` is for lifecycle state only: `Active` or `Graduated`
- `condition` is for tree health/quality state: `good`, `fair`, `poor`
- `notes` should be treated as general or tree-keeper-visible notes
- `admin_notes` is admin-only/internal
- `survey_logs` references surveys associated with the tree
- `tree_keeper_id` identifies the member currently assigned to the tree

---

## Table: `public.members`

Represents internal members, including admins and tree keepers.

### Columns

- `id`: bigint, primary key
- `created_at`: timestamptz, defaults to `now()`
- `firstname`: text
- `lastname`: text
- `email`: text, unique
- `phone`: text
- `joined`: date, defaults to `now()`
- `trees_assigned`: bigint[], nullable
- `trees_count`: bigint, defaults to `0`
- `role`: `MemberType`, nullable

### Relationships

Referenced by:

- `tasks.created_by -> members.id`
- `trees.tree_keeper_id -> members.id`

### Product meaning

- Members replaces older `volunteers` terminology
- `role` distinguishes `Admin` and `Tree Keeper`
- `trees_assigned` should represent ECOSLO tree numbers or assigned tree references as currently implemented
- `trees_count` is derived/supporting operational data

---

## Table: `public.tasks`

Represents one-off tasks assigned to one or more members.

### Columns

- `id`: bigint, primary key
- `created_at`: timestamptz, defaults to `now()`
- `completion_date`: timestamptz, nullable
- `message`: text
- `title`: text, defaults to empty string
- `assignees`: bigint[], nullable
- `is_complete`: boolean, defaults to `false`
- `surveys_needed`: bigint, defaults to `0`
- `created_by`: bigint, nullable, foreign key to `members.id`

### Relationships

- `tasks.created_by -> members.id`
- `surveys.task -> tasks.id`

### Product meaning

- Tasks are **one-off** items, not recurring schedules
- A single task may be assigned to one member or many members
- Group tasks remain a **single shared task object**, not duplicated tasks per assignee
- `surveys_needed` is the current source of truth for survey gating logic

---

## Table: `public.surveys`

Represents survey submissions associated with a task and/or tree.

### Columns

- `id`: bigint, primary key
- `created_at`: timestamptz, defaults to `now()`
- `task`: bigint, nullable, foreign key to `tasks.id`
- `tree`: bigint, nullable, foreign key to `trees.ecoslo_num`
- `body`: jsonb

### Relationships

- `surveys.task -> tasks.id`
- `surveys.tree -> trees.ecoslo_num`

### Product meaning

The current survey table stores detailed survey form data inside `body`.

This means fields such as the following should be serialized inside `body` rather than expected as top-level DB columns:

- issue type
- optional `other` issue text
- image link
- admin contact request / needs contact response
- any future structured survey answers

---

## Table: `public.reminders`

Represents recurring reminder definitions.

### Columns

- `id`: bigint, primary key
- `created_at`: timestamptz, defaults to `now()`
- `name`: text, defaults to empty string
- `is_active`: boolean, defaults to `true`
- `crons_expression`: text, defaults to empty string
- `task_message`: text, defaults to empty string
- `assignees`: bigint[]
- `is_group_task`: boolean, defaults to `false`

### Product meaning

- Reminders define recurring operational workflows
- Reminder definitions are intended to drive future scheduled task generation
- `crons_expression` is the current persistence field for schedule configuration
- `task_message` is the template/body for the generated reminder content
- `assignees` stores the target member IDs for the reminder

---

## Table: `public.templates`

Represents reusable reminder/task templates.

### Columns

- `id`: bigint, primary key
- `created_at`: timestamptz, defaults to `now()`
- `crons_expression`: text, defaults to empty string
- `task_message`: text, defaults to empty string
- `assignees`: bigint[]
- `is_group_task`: boolean, defaults to `false`
- `name`: text, defaults to empty string

### Product meaning

- Templates store reusable scheduling/message definitions
- The schema is intentionally very similar to `reminders`
- Templates are meant to support faster creation of reminders or repeated operational workflows

---

## Relationship Summary

```text
members (1) ──< trees (many)       via trees.tree_keeper_id → members.id
members (1) ──< tasks (many)       via tasks.created_by → members.id
tasks   (1) ──< surveys (many)     via surveys.task → tasks.id
trees   (1) ──< surveys (many)     via surveys.tree → trees.ecoslo_num
```

---

## Product Logic Clarifications

This section captures clarified logic that should be treated as part of the current spec.

## 1. Tasks are one-off only

Tasks are one-off work items. Recurring behavior belongs to the reminders system, not the tasks page itself.

---

## 2. Survey-gated task completion uses `surveys_needed`

The original planning materials used both boolean-style and integer-style descriptions for whether a task needs a survey. The clarified product rule is:

- `tasks.surveys_needed = 0` means the task does **not** currently require any remaining survey submissions before completion
- `tasks.surveys_needed > 0` means the task still requires survey submissions before completion
- The integer field is the source of truth
- A separate boolean field is **not required** in the current model

### Completion behavior

- If `surveys_needed = 0`, the task can be completed directly
- If `surveys_needed > 0`, the user should be redirected into or required to complete the survey workflow
- Each valid survey submission tied to that task should decrement `surveys_needed` by 1
- When `surveys_needed` reaches `0`, the task should **auto-complete**
- When the task auto-completes, it should set:
  - `is_complete = true`
  - `completion_date = current timestamp`

### Group task behavior

- Group tasks remain a single shared task object
- If a group task is completed, it is completed for the whole group
- For survey-gated shared tasks, `surveys_needed` represents the number of required remaining survey submissions for that shared task object

---

## 3. Survey data is stored in `surveys.body`

The current schema for `public.surveys` contains only:

- `task`
- `tree`
- `body`

Therefore, all detailed survey response content should be stored in `body`.

### Expected survey body content

The exact JSON structure may evolve, but it should support fields such as:

- `issue`
- `otherIssueText`
- `imageLink`
- `needsContact`
- any additional structured survey responses

Example conceptual shape:

```json
{
  "issue": "Damaged bark",
  "otherIssueText": "",
  "imageLink": "https://...",
  "needsContact": true
}
```

---

## 4. Members replaces Volunteers

All new development should use:

- **Members** for the overall internal user table
- **Tree Keepers** for the role formerly referred to as volunteers in some planning notes

Avoid introducing new `volunteers` naming in routes, components, or docs unless referencing legacy code that has not yet been migrated.

---

## 5. Trees use both `status` and `condition`

These fields have distinct meanings and should not be conflated.

- `status` = lifecycle state
  - `Active`
  - `Graduated`

- `condition` = tree condition/health state
  - `good`
  - `fair`
  - `poor`

---

## 6. Reminders and Templates are schema-driven first

Reminder and template behavior should be designed around the actual database schema rather than around rough UI labels alone.

- `name`, `task_message`, `crons_expression`, `assignees`, and `is_group_task` are the current source-of-truth fields
- UI concepts like “Audience” must eventually resolve to actual stored data, primarily `assignees`
- UI designs are helpful references but may need to be adjusted to fit the product requirements and schema

---

## Page Specifications

The following sections describe intended page behavior based on the original PRD, updated to reflect the current schema and clarified logic.

# Trees Page

## Purpose

Allow admins to manage tree records and inspect tree-related operational data.

## Core requirements

- list trees
- search, filter, sort, and paginate
- export tree data
- create and edit trees
- view tree details
- delete trees where allowed

## Data source

Primary source: `public.trees`

## Important tree fields for display/use

- `ecoslo_num`
- `status`
- `condition`
- `species_name`
- `common_name`
- `funder`
- `date_planted`
- `address`
- `latitude`
- `longitude`
- `is_public`
- `tree_keeper_id`
- `next_watering_date`
- `weekly_watering_status`
- `next_mulching_date`
- `yearly_mulching_status`
- `notes`
- `admin_notes`
- `survey_logs`

## Expected UI features

- page header
- export CSV button
- add tree action
- control panel with:
  - search
  - status filters
  - condition filters
  - visibility filter
- tree list/table
- pagination/footer
- view/edit details panel

## Notes

- Public/private visibility should be driven by `is_public`
- Tree keeper information should be derived via `tree_keeper_id -> members.id`
- `survey_logs` may be used later to surface survey history

---

# Members Page

## Purpose

Allow admins to manage internal members and tree keeper assignments.

## Core requirements

- list members
- create new members
- edit members
- search/filter/sort/export
- distinguish roles

## Data source

Primary source: `public.members`

## Important fields

- `firstname`
- `lastname`
- `email`
- `phone`
- `joined`
- `role`
- `trees_assigned`
- `trees_count`

## Expected UI features

- page header
- export CSV button
- add member action
- control panel with search and role filtering
- members list/table
- pagination/footer
- view/edit details panel

---

# Tasks Page

## Purpose

Allow internal users to view and manage one-off tasks.

## Data source

Primary source: `public.tasks`

## Important fields

- `id`
- `created_at`
- `title`
- `message`
- `assignees`
- `is_complete`
- `completion_date`
- `surveys_needed`
- `created_by`

## Access rules

### Admins

- can view all tasks
- can create tasks
- can complete tasks
- can sort/filter tasks

### Tree Keepers

- should only see tasks assigned directly to them or shared tasks that include them
- can complete visible tasks
- should not see unrelated tasks

### Public

- no access

## UI direction

The original PRD described a table-like tasks page, but current design work is trending toward a **card-based task list with top filters**. The exact final UI can evolve, but it must support the same underlying product behavior.

## Expected UI capabilities

- search tasks
- filter by completion status
- filter by assignee
- filter by survey requirement
- browse open tasks by default
- inspect task details
- complete tasks

## Task completion rules

- if `surveys_needed = 0`, allow direct completion
- if `surveys_needed > 0`, direct the user into survey submission flow
- after the final required survey is submitted, auto-complete the task

## Data handling expectations

- `assignees` is stored as a bigint array of member IDs
- any assignee-facing display may require member lookup/formatting
- completed tasks may later be cleaned up or expired, but that is not currently encoded in schema

---

# Reminders Page

## Purpose

Allow admins to view, create, edit, activate/deactivate, and delete recurring reminders.

## Data source

Primary source: `public.reminders`
Secondary supporting source: `public.templates`

## Reminder fields

- `id`
- `created_at`
- `name`
- `is_active`
- `crons_expression`
- `task_message`
- `assignees`
- `is_group_task`

## Template fields

- `id`
- `created_at`
- `name`
- `crons_expression`
- `task_message`
- `assignees`
- `is_group_task`

## Expected UI capabilities

- list existing reminders
- inspect a selected reminder
- create a new reminder
- edit an existing reminder
- delete a reminder
- toggle active/inactive state
- edit scheduling fields
- edit message template content

## Product behavior

- reminders are definitions for recurring workflows
- reminders should be admin-managed
- reminder schedule data ultimately persists into `crons_expression`
- reminder target members persist into `assignees`
- reminder message content persists into `task_message`
- templates should support reusable reminder/task configuration

## Notes on UI vs data model

Some designs may use labels like:

- Type
- Audience
- Schedule
- Next Send

These can be valid UI affordances, but the backing persistence should still be aligned to the actual schema.

---

# Survey Page

## Purpose

Allow users to submit structured survey information tied to a task and tree.

## Data source

Primary source: `public.surveys`
Supporting sources:

- `public.tasks`
- `public.trees`

## Required survey record structure

Each created survey should be able to persist:

- `task`: selected `tasks.id`
- `tree`: selected `trees.ecoslo_num`
- `body`: structured survey content

## Expected survey body content

The form should be able to collect and store fields such as:

- issue type
- optional custom issue text
- image link
- needs contact / admin contact response

## Product behavior

- submitting a survey should create a `surveys` row
- the survey should be tied to the relevant task and tree
- valid task-linked survey creation should decrement `tasks.surveys_needed`
- when `tasks.surveys_needed` reaches `0`, the task should auto-complete

## Expected UI capabilities

- select task
- select tree
- select issue type
- optionally provide other issue text
- optionally provide image link
- indicate whether admin follow-up/contact is needed
- submit successfully with clear feedback

---

# Public Map Page

## Purpose

Expose public tree information to non-authenticated users.

## Data source

Public-safe subset of `public.trees`

## Publicly safe fields

At minimum, the public map should only expose non-sensitive tree/location metadata required for display, such as:

- tree identifier
- latitude/longitude
- species/common names
- date planted
- public-safe tree keeper naming only if explicitly intended
- `ecoslo_num`
- `status`
- `is_public`

## Expected UI capabilities

- render map and markers
- allow marker selection
- show public tree info panel
- support map searching/filtering
- preserve privacy for non-public/internal-only data

---

# Login / Auth Pages

## Purpose

Support authenticated access for internal users.

## Expected capabilities

- login page with email entry
- magic link flow
- auth callback handling
- session-aware routing
- route protection for internal pages

## Notes

The original planning notes referenced Supabase-based magic-link auth and SSR/callback/session work. Exact implementation may continue evolving, but auth pages should support internal member access cleanly.

---

# Dashboard Page

## Purpose

Provide a high-level operational overview for internal users, especially admins.

## Expected data sources

- tasks
- reminders
- trees

## Expected UI capabilities

- tasks widget
- reminders widget
- trees widget
- navigation into full page flows

## Notes

Dashboard implementation can follow after core operational pages are established.

---

## Reminder and Survey Operational Intent

The original PRD emphasized a strong relationship between recurring reminders, task generation, and survey collection.

The intended long-term operational flow is:

1. Admin defines reminder/template behavior
2. Reminder schedule triggers recurring task-like work
3. Users receive and complete work
4. Some tasks require one or more survey submissions
5. Survey submissions update tree/task operational state

Not all of this workflow is fully encoded in the current schema or current sprint scope, but it remains part of the product direction.

---

## Tree Lifecycle Intent

The original PRD specified tree lifecycle concepts such as:

- trees graduating after three years
- recurring watering/mulching/pruning/check-in logic
- alerts before graduation

The current schema partially supports maintenance tracking through:

- `status`
- `next_watering_date`
- `weekly_watering_status`
- `next_mulching_date`
- `yearly_mulching_status`

Additional lifecycle automation may be implemented later, but these concepts remain important to the product direction.

---

## Export / Search / Filtering Expectations

Across internal management pages, the general product expectation is:

- searchable data lists
- useful filters tied to actual schema fields
- paginated or otherwise navigable result sets
- export support for operational/admin use

These capabilities apply most strongly to:

- Trees
- Members
- Tasks

---

## Known Source-of-Truth Decisions

These decisions should be treated as authoritative for current development.

1. **Use current DB schema as source of truth**
2. **Task survey gating uses `tasks.surveys_needed`**
3. **Tasks auto-complete when `surveys_needed` reaches 0 after valid survey submission**
4. **Detailed survey response content lives in `surveys.body` JSON**
5. **Use `Members` and `Tree Keepers` terminology, not `Volunteers`**
6. **UI designs are helpful references, but schema + product requirements take precedence**

---

## Suggested Developer Interpretation Guidelines

When there is ambiguity, developers should follow this order of precedence:

1. Current database schema
2. Clarified product rules in this document
3. Original PRD behavior intent
4. Existing codebase conventions
5. Figma/UI mocks

---
