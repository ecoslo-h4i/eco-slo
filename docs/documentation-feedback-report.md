# ECOSLO Documentation Audit Report

Audit of `docs/ECOSLO Handoff Product Documentation.pdf` against the current codebase.

**Date:** 2026-06-10

## Legend

- **CORRECT** — matches the codebase
- **INACCURATE** — does not match what's implemented
- **PARTIALLY ACCURATE** — some truth but misleading or incomplete

---

## 1. Tree Dashboard (Admin)

| Doc Claim                                                      | Verdict                | Details                                                                                                                                                          |
| -------------------------------------------------------------- | ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Centralized database of all active and graduated trees         | **CORRECT**            | Trees page at `src/app/(admin)/trees/page.tsx`                                                                                                                   |
| Searchable and sortable table                                  | **CORRECT**            | Fuse.js fuzzy search, column header sorting                                                                                                                      |
| Add, edit, and delete tree entries                             | **PARTIALLY ACCURATE** | Add and edit work. Single delete works. **Bulk delete is NOT implemented** — doc implies multi-select delete ("Select one or more trees")                        |
| Mark trees as Active or Graduated                              | **CORRECT**            | Status dropdown in edit form                                                                                                                                     |
| Export tree data as CSV                                        | **INACCURATE**         | Doc claims "Export All Trees" vs "Export Filtered Results" as two options. **Only filtered/displayed results can be exported** — there is no "Export All" option |
| View maintenance information, survey history, and tree details | **CORRECT**            | Maintenance fields (watering/mulching dates/status) and survey_logs array displayed in tree detail modal                                                         |

## 2. Members Dashboard (Admin)

| Doc Claim                                     | Verdict     | Details                                         |
| --------------------------------------------- | ----------- | ----------------------------------------------- |
| Manage Tree Keepers and administrators        | **CORRECT** | Full CRUD at `src/app/(admin)/members/page.tsx` |
| Store volunteer contact information           | **CORRECT** | Email, phone, name fields                       |
| Assign roles and tree responsibilities        | **CORRECT** | Role dropdown + tree assignment picker modal    |
| Search, filter, add, edit, and remove members | **CORRECT** | Search, role filter, full CRUD                  |
| Export member data                            | **CORRECT** | CSV export exists                               |

## 3. Public Tree Map

| Doc Claim                                        | Verdict     | Details                                                              |
| ------------------------------------------------ | ----------- | -------------------------------------------------------------------- |
| Interactive map displaying tree locations        | **CORRECT** | Leaflet map with custom tree pin markers                             |
| Search and filter trees by status and visibility | **CORRECT** | Status filter (Active/Graduated), visibility filter (Public/Private) |
| View tree information through marker popups      | **CORRECT** | MapPopout component shows tree details                               |
| Accessible to the public without authentication  | **CORRECT** | Under `(public)` route group, uses `public_trees` view               |

## 4. Tasks System

| Doc Claim                                        | Verdict     | Details                                                                                                                                                          |
| ------------------------------------------------ | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Create maintenance and administrative tasks      | **CORRECT** | Full task CRUD                                                                                                                                                   |
| Assign tasks to individuals or groups            | **CORRECT** | `assignees` is an array of member IDs                                                                                                                            |
| Track completion status                          | **CORRECT** | `is_complete` boolean + `completion_date`                                                                                                                        |
| Connect surveys to task completion when required | **CORRECT** | `survey_mode`, `survey_required_count`, and `surveys_needed`; `complete_task_survey()` updates required progress and `complete_task()` handles direct completion |

## 5. Automated Reminders

| Doc Claim                                                          | Verdict                | Details                                                                                                                                                                                            |
| ------------------------------------------------------------------ | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Create recurring reminders                                         | **CORRECT**            | Full reminder CRUD with CRON scheduling                                                                                                                                                            |
| Configure schedules for watering, mulching, pruning, and check-ins | **PARTIALLY ACCURATE** | Watering and Mulching are explicit task types. **"Pruning" does NOT exist** — there is no pruning type in the `TaskType` enum (only Watering, Mulching, Other). Check-ins would fall under "Other" |
| Manage reminder templates and recipients                           | **CORRECT**            | Separate `templates` table with full CRUD                                                                                                                                                          |
| Automate recurring maintenance communication                       | **CORRECT**            | `tick-reminders` edge function fires due reminders, `send-pending-emails` delivers via Resend                                                                                                      |

## 6. Tree Health Surveys

| Doc Claim                                                                     | Verdict                | Details                                                                                                                       |
| ----------------------------------------------------------------------------- | ---------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Allow Tree Keepers to report tree issues                                      | **PARTIALLY ACCURATE** | Surveys exist but can **only be submitted through task completion workflows** — there is no standalone survey submission page |
| Track diseases, pests, damaged bark, stake problems, and maintenance concerns | **INACCURATE**         | The **actual issue categories are completely different** from what the doc lists. See below                                   |
| Store survey history with associated tree records                             | **CORRECT**            | `survey_logs` array on trees table                                                                                            |
| Enable issue escalation to administrators                                     | **PARTIALLY ACCURATE** | `adminContact` boolean captured in survey body, but **no automated notification is sent to admins** when this is flagged      |

### Survey Issue Categories — Doc vs Reality

| Doc Claims             | Actual Code (`SURVEY_ISSUE_OPTIONS`)    |
| ---------------------- | --------------------------------------- |
| Stake Fix Needed       | `watering` — "Watering"                 |
| Leaves Need Attention  | `mulching` — "Mulching / soil"          |
| Damaged Bark           | `pest_damage` — "Pests or disease"      |
| Re-Mulch Required      | `structural` — "Structural / stability" |
| Needs Supplies         | `signage` — "Signage"                   |
| Disease or Pest Issues | `other` — "Other"                       |
| Other                  | _(no seventh option)_                   |

The documented categories **do not exist anywhere in the codebase**. The actual categories are entirely different.

## 7. Authentication System

| Doc Claim                                                       | Verdict     | Details                                                 |
| --------------------------------------------------------------- | ----------- | ------------------------------------------------------- |
| Secure login using magic-link authentication                    | **CORRECT** | Supabase auth with Resend email delivery                |
| Role-based access control                                       | **CORRECT** | RLS policies + `adminOnly` nav filtering                |
| Separate experiences for Public Users, Tree Keepers, and Admins | **CORRECT** | Three distinct experiences with different access levels |

## 8. Adding a Tree — Required Fields

| Doc Claims                                                                                             | Verdict                | Details                                                                                                   |
| ------------------------------------------------------------------------------------------------------ | ---------------------- | --------------------------------------------------------------------------------------------------------- |
| ECOSLO Number, Species Name, Common Name, Planting Date, Address, Coordinates, Tree Keeper information | **PARTIALLY ACCURATE** | All these exist, plus the code also requires **Funder** as a field. Tree Keeper is optional, not required |

## 9. Adding a Member — Fields

| Doc Claims                                       | Verdict                | Details                                                                                 |
| ------------------------------------------------ | ---------------------- | --------------------------------------------------------------------------------------- |
| First Name, Last Name, Email, Phone Number, Role | **PARTIALLY ACCURATE** | These exist, but doc omits **Joined Date** (required) and **Assigned Trees** (optional) |

## 10. Task Filters

| Doc Claims                    | Verdict                | Details                                                                                                                                                                         |
| ----------------------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Open, Completed, Needs Survey | **PARTIALLY ACCURATE** | Status filters are "All", "Open", "Completed". Survey filters are separate: "All", "No Survey", "Survey Available", "Survey Required". Also filterable by assignee (admin only) |

## 11. Member Roles

| Doc Claim            | Verdict        | Details                                                                                                               |
| -------------------- | -------------- | --------------------------------------------------------------------------------------------------------------------- |
| "Administrator" role | **INACCURATE** | The actual role name is **"Admin"**, not "Administrator". The database enum is `MemberType: "Admin" \| "Tree Keeper"` |

## 12. User Roles & Permissions Table

| Doc Claim                               | Verdict                | Details                                                                                     |
| --------------------------------------- | ---------------------- | ------------------------------------------------------------------------------------------- |
| Tree Keepers: "Limited" tree management | **PARTIALLY ACCURATE** | Tree Keepers can only edit `condition` and `notes` on assigned trees — cannot add or delete |
| Tree Keepers: "Limited" data export     | **INACCURATE**         | No evidence Tree Keepers have any export capability — export is admin-only                  |

## 13. Automated System Behavior

| Doc Claim                                                      | Verdict        | Details                                                                                                                                                                                                                                                |
| -------------------------------------------------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Trees automatically graduate after three years**             | **INACCURATE** | Graduation is **manual only** — admin sets status via dropdown. SPECDOC explicitly notes: "The original PRD specified tree lifecycle concepts such as: trees graduating after three years... Additional lifecycle automation may be implemented later" |
| Graduated trees no longer receive watering reminders           | **INACCURATE** | **No logic exists** to gate reminders based on graduation status                                                                                                                                                                                       |
| Graduated trees no longer generate recurring maintenance tasks | **INACCURATE** | Same — no implementation                                                                                                                                                                                                                               |
| Graduated trees continue appearing in historical records       | **CORRECT**    | They remain in the database                                                                                                                                                                                                                            |

## 14. Notification System

| Doc Claim                                              | Verdict        | Details                                                                 |
| ------------------------------------------------------ | -------------- | ----------------------------------------------------------------------- |
| New tasks are assigned → notification sent             | **CORRECT**    | `send-pending-emails` edge function delivers task emails via Resend     |
| Surveys require administrator attention → notification | **INACCURATE** | `adminContact` boolean is captured but **no notification is triggered** |
| Trees approach graduation status → notification        | **INACCURATE** | **Not implemented at all** — no graduation alert system                 |
| Reminder schedules are triggered → notification        | **CORRECT**    | Reminder firing creates tasks which trigger emails                      |

## 15. Reminder Examples

| Doc Claim                      | Verdict                | Details                                                            |
| ------------------------------ | ---------------------- | ------------------------------------------------------------------ |
| Weekly watering reminders      | **CORRECT**            | Watering task type + CRON scheduling                               |
| Annual mulching reminders      | **CORRECT**            | Mulching task type + CRON scheduling                               |
| Annual pruning reminders       | **INACCURATE**         | **No "Pruning" task type exists** — only Watering, Mulching, Other |
| Tree Keeper check-in reminders | **PARTIALLY ACCURATE** | Would need to use "Other" type — no dedicated check-in type        |

---

## Summary of Critical Inaccuracies

1. **Auto-graduation after 3 years** — Not implemented; graduation is manual only
2. **Graduation stops reminders/tasks** — No such logic exists
3. **Survey issue categories** — Completely wrong; 6 different categories in code vs 7 different ones in doc
4. **"Administrator" role name** — Actually "Admin" in the database
5. **CSV export "Export All" option** — Does not exist; only filtered export
6. **Bulk tree deletion** — Not implemented
7. **Pruning reminders** — No pruning task type
8. **Notifications for surveys needing admin attention** — Not implemented
9. **Notifications for trees approaching graduation** — Not implemented
10. **Standalone survey submission** — Surveys are task-linked only, no independent submission

The document is roughly **70-75% accurate** to the actual implementation. The biggest gaps are around the graduation automation system (entirely aspirational, not built), the survey categories (completely wrong), and several notification features that don't exist.
