# ECOSLO Tree Management Platform - Product Documentation

## Product Overview

### Purpose

The ECOSLO Tree Management Platform is designed to replace ECOSLO's manual spreadsheets workflow for tracking planted trees, managing Tree Keepers, and coordinating tree maintenance activities. The platform centralizes tree records, volunteer information, automated reminders, task management, and public-facing tree exploration into a single system.

The platform helps ECOSLO maintain accurate tree data, improve communication with Tree Keepers, automate recurring maintenance reminders, and provide public visibility into community tree planting efforts.

### Main Features

#### 1. Dashboard (Admin)

- Overview of key metrics: open tasks, total trees, team members, and tasks awaiting survey completion.
- Quick-action links to Trees, Members, Reminders, and Tasks pages.
- Detail cards showing 30-day activity trends.
- Personalized welcome message for the logged-in user.

#### 2. Tree Dashboard (Admin)

- Centralized database of all active and graduated trees.
- Searchable and sortable table of tree records.
- Add, edit, and delete tree entries (single delete only).
- Mark trees as Active or Graduated (manual status change).
- Export currently displayed/filtered tree data as CSV.
- View maintenance information (watering and mulching dates/status), survey history, and tree details.

#### 3. Members Dashboard (Admin)

- Manage Tree Keepers and Admins.
- Store volunteer contact information.
- Assign roles and tree responsibilities.
- Search, filter, add, edit, and remove members.
- Export currently displayed member data as CSV.

#### 4. Public Tree Map

- Interactive map displaying tree locations using Leaflet.
- Search and filter trees by status and visibility.
- View tree information through marker popups.
- Accessible to the public without authentication.

#### 5. Tasks System

- Create maintenance and administrative tasks.
- Assign tasks to one or more individuals.
- Track completion status with timestamps.
- Optionally require survey completion before a task can be marked complete.
- Export task data as CSV with "Export All" or "Export Filtered" options.

#### 6. Automated Reminders

- Create recurring reminders for Tree Keepers and Admins.
- Configure schedules using weekly, monthly, or yearly frequency with CRON-based automation.
- Select from pre-built templates (Watering, Mulching, or custom "Other" types).
- Manage reminder templates and recipients.
- Automate recurring maintenance communication via email (delivered through Resend).

#### 7. Tree Health Surveys

- Allow Tree Keepers to report tree issues through task-linked survey forms.
- Track issues across the following categories:
  - Watering
  - Mulching / soil
  - Pests or disease
  - Structural / stability
  - Signage
  - Other (free-text description)
- Capture optional image links, free-form notes, and admin contact requests.
- Store survey history with associated tree records (survey IDs linked to trees).

#### 8. Authentication System

- Secure login using magic-link authentication (email-based, powered by Supabase Auth and Resend).
- Role-based access control enforced via Supabase Row-Level Security (RLS).
- Separate experiences for Public Users, Tree Keepers, and Admins.

---

## Intended Use Cases

### Administrators

- Manage tree inventory (add, edit, delete, export).
- Manage volunteers and Tree Keepers (add, edit, delete, assign trees).
- Create, edit, and monitor automated reminders.
- Create, assign, and track tasks.
- Export operational data (trees, members, tasks).
- Review survey submissions linked to tasks and tree records.

### Tree Keepers

- View the dashboard with personal task statistics.
- View assigned tasks.
- Receive task notification emails triggered by reminders.
- Submit tree health surveys to complete assigned tasks.
- Edit limited tree fields (condition and notes) on assigned trees.

### Community Members

- Explore tree planting locations through the public map.
- View basic information about community trees (species, location, condition, status).
- Learn about ECOSLO's environmental stewardship efforts.

---

## Admin Manual

### Accessing the Admin Dashboard

1. Navigate to the ECOSLO platform.
2. Select "Log In."
3. Enter your authorized email address.
4. Open the magic-link email sent via Resend.
5. Click the provided authentication link.
6. Upon successful login, you will be redirected to the Dashboard.

### Managing Trees

#### Viewing Trees

1. Navigate to the "Trees" page.
2. Browse the tree inventory table.
3. Use search, sorting, and filters to locate specific trees.

Available filters include:

- **Status:** Active / Graduated
- **Condition:** Good / Fair / Poor
- **Visibility:** Public / Private

#### Adding a Tree

1. Click "Add Tree."
2. Enter the tree information:
   - ECOSLO Number (required)
   - Species Name (required)
   - Common Name (required)
   - Funder (required)
   - Date Planted (required, defaults to today)
   - Address (required)
   - Latitude and Longitude (required; "Use my location" button available)
   - Status (Active or Graduated)
   - Condition (Good, Fair, or Poor)
   - Visibility (Public or Private)
   - Next Watering Date (optional)
   - Watering Status (Completed or Pending)
   - Next Mulching Date (optional)
   - Mulching Status (Completed or Pending)
   - Notes (optional)
   - Admin Notes (optional)
3. Click "Save."

#### Editing a Tree

1. Click a tree row to open the detail modal.
2. Click the edit (pencil) icon.
3. Update the desired fields.
4. Click "Save Changes."

> **Note:** Tree Keepers can only edit the Condition and Notes fields on their assigned trees.

#### Deleting a Tree

1. Open a tree's detail modal.
2. Click the delete (trash) icon.
3. Confirm the deletion.

> **Note:** Bulk deletion is not supported. Trees must be deleted one at a time.

#### Exporting Tree Data

1. Click "Export CSV."
2. The currently filtered/displayed tree data will be downloaded.

> **Note:** To export all trees, clear all filters and search before exporting.

### Managing Members

#### Viewing Members

1. Navigate to the "Members" page (Admin only).
2. Browse all Tree Keepers and Admins.
3. Use search and role filter to find specific members.

#### Adding a Member

1. Click "Add Member."
2. Enter:
   - First Name (required)
   - Last Name (required)
   - Email (optional)
   - Phone Number (optional)
   - Joined Date (required, defaults to today)
   - Role (required): Admin or Tree Keeper
   - Assigned Trees (optional)
3. Save the record.

#### Editing a Member

1. Click a member row to open the detail form.
2. Update information.
3. Click "Save Changes."

#### Deleting a Member

1. Open a member's detail form.
2. Click the delete (trash) icon.
3. Confirm the deletion (this action cannot be undone).

#### Exporting Member Data

1. Click "Export CSV."
2. The currently filtered/displayed member data will be downloaded.

#### Assigning Trees to Members

1. Open a member's detail form.
2. In the "Assigned Trees" section, click the add button to open the tree picker.
3. Select trees to assign.
4. Save changes. The system automatically syncs tree-member relationships (sets `tree_keeper_id` on the trees and updates counts).

### Member Roles

#### Admin

- Full platform access.
- Can manage trees, members, reminders, tasks, and templates.
- Can view dashboard with full team statistics.
- Can export data from all pages.

#### Tree Keeper

- Can view the dashboard with personal task statistics.
- Can view assigned tasks and complete them.
- Can submit surveys linked to tasks.
- Can edit limited fields (condition, notes) on assigned trees.
- Cannot access Members or Reminders pages.
- Cannot add, delete, or export trees or members.

### Managing Tasks

#### Creating a Task

1. Navigate to the "Tasks" page.
2. Click "Add Task" (Admin only).
3. Enter:
   - Title (required)
   - Message / description (optional)
   - Assignee(s) — select one or more members
   - Linked Trees — optional tree links selected from assigned assignee trees
   - Survey Mode — No Survey, Optional Survey, or Required Survey
   - Required Surveys — count shown only when Required Survey is selected
4. Save the task.

#### Completing a Task

1. Open the assigned task by clicking its card.
2. If no required survey is outstanding, click "Complete."
3. If surveys are required, complete the task-modal survey form for each required submission.
4. Optional-survey tasks can be completed immediately and can still accept survey submissions for logging.
5. For linked-tree required tasks, one counted survey per linked tree counts toward completion.
6. The task will automatically be marked complete when all required surveys are submitted.

#### Viewing Task Status

Tasks can be filtered by:

- **Status:** All / Open / Completed
- **Survey:** All / No Survey / Survey Available / Survey Required
- **Assignee:** Filter by specific team member (Admin only)
- **Search:** Full-text search across title, message, and assignee names

#### Exporting Task Data

1. Click "Export CSV."
2. Choose:
   - Export All Tasks
   - Export Filtered Tasks
3. Download the generated file.

### Managing Reminders

#### Creating a Reminder

1. Navigate to the "Reminders" page (Admin only).
2. Click "Create New Reminder."
3. Configure:
   - Reminder Name
   - Type — select from templates (Watering, Mulching) or enter a custom name (classified as "Other")
   - Recipients — select members by role group or individually
   - Frequency — Weekly, Monthly, or Yearly
   - Schedule — Day of week (weekly), day of month (monthly), or specific date (yearly) + time
   - Message Template — supports dynamic variables (first name, tree count, tree names)
   - Group Task toggle — whether to create one shared task or individual tasks per assignee
   - Survey Required toggle — whether task completion requires survey submissions (auto-enabled for Watering/Mulching types)
   - Active toggle — whether the reminder is currently enabled
4. Save the reminder.

#### Editing a Reminder

1. Select a reminder from the list.
2. Click the edit (pencil) icon.
3. Update settings.
4. Save changes.

#### Deleting a Reminder

1. Open the reminder.
2. Click the delete (trash) icon.
3. Confirm deletion.

#### How Reminders Work

Reminders use CRON-based scheduling (timezone-aware to Pacific Time):

1. The `tick-reminders` edge function runs periodically and checks for due reminders.
2. When a reminder fires, it creates task(s) for the assigned recipients.
3. The `send-pending-emails` edge function picks up new tasks and delivers notification emails via Resend.
4. The reminder's next run time is automatically calculated from its CRON expression.

### Reviewing Survey Reports

#### Viewing Submitted Surveys

Surveys can be viewed in two places:

1. **Tree Detail Modal:** Open a tree record to see its survey history (survey IDs, dates, issues, images, submitter info, and notes).
2. **Task Detail Modal:** Open a task to see associated survey submissions and completion progress.

> **Note:** There is no standalone admin page for browsing all surveys. Surveys are accessed through their linked tree or task records. The API supports full survey CRUD at `/api/admin/surveys` for programmatic access.

#### Survey Fields

Each survey submission includes:

- Associated tree (ecoslo number)
- Issue type (Watering, Mulching/soil, Pests or disease, Structural/stability, Signage, or Other)
- Free-text description (required when "Other" is selected)
- Image link (optional URL)
- Admin contact request (yes/no)
- Notes (optional free-form text)
- Submitter information (name, email, phone)

---

## User Roles and Permissions

| Feature                          | Public User | Tree Keeper | Admin |
| -------------------------------- | ----------- | ----------- | ----- |
| View Public Map                  | Yes         | Yes         | Yes   |
| Log In                           |             | Yes         | Yes   |
| View Dashboard                   |             | Yes         | Yes   |
| View Assigned Tasks              |             | Yes         | Yes   |
| Submit Surveys                   |             | Yes         | Yes   |
| Complete Tasks                   |             | Yes         | Yes   |
| Edit Tree (condition/notes only) |             | Yes         | Yes   |
| Manage Trees (full CRUD)         |             |             | Yes   |
| Manage Members                   |             |             | Yes   |
| Manage Reminders                 |             |             | Yes   |
| Manage Templates                 |             |             | Yes   |
| Export Data                      |             |             | Yes   |

---

## Automated System Behavior

### Tree Status

Trees have two statuses: **Active** and **Graduated**.

- Status changes are **manual** — an administrator must update a tree's status through the edit form.
- Graduated trees remain stored in the database and continue to appear in the tree inventory.

> **Note:** There is no automatic graduation based on planting date. Status management is entirely manual.

### Reminder Automation

The platform automatically generates recurring tasks and sends notification emails based on administrator-configured reminder schedules.

Available reminder types:

- **Watering** — creates tasks that require per-tree survey completion.
- **Mulching** — creates tasks that require per-tree survey completion.
- **Other** — creates general tasks with configurable survey requirements.

The automation pipeline:

1. `tick-reminders` edge function fires due reminders and creates tasks.
2. `send-pending-emails` edge function delivers task notification emails to assignees via Resend.
3. `cleanup-completed-tasks` edge function performs daily cleanup of old completed tasks.

### Email Notifications

The platform sends email notifications when:

- New tasks are created (either manually by an admin or automatically by a reminder).
- Emails include personalized content using message variables (first name, tree count, tree names).

> **Note:** The platform does not currently send automated notifications for: survey submissions requesting admin contact, trees approaching any status change, or reminder schedule summaries. The `adminContact` field is captured in surveys but does not trigger an alert.

---

## Plan for Communication After Handoff

### Immediate Support (1-3 Weeks Post-Handoff)

**Primary Contact:**

Product Manager
Leticia Leon-Rodriguez

- Email: lleonrod@calpoly.edu
- Phone: (559) 536-1330

**Technical Leads:**
Sean Nguyen
Matthew Blam

**Nonprofit Contact:**

Kendra Paulding

- Website: www.ecoslo.org
- Email: kendra@ecoslo.org

### Ongoing Support

- Future Hack4Impact teams should maintain documentation and support new feature requests.
- ECOSLO administrators should regularly review reminder schedules and survey submissions.
- Periodic check-ins with ECOSLO are recommended to evaluate adoption and operational effectiveness.

---

## Maintenance & Support Recommendations

- Regularly verify reminder schedules and CRON configurations in the Reminders page.
- Test authentication and magic-link email delivery via Resend.
- Monitor the `tick-reminders`, `send-pending-emails`, and `cleanup-completed-tasks` edge functions for errors.
- Review survey submissions through tree and task detail modals for unresolved issues.
- Monitor Supabase database performance and storage growth.
- Audit exported CSV data for accuracy.
- Collect feedback from administrators and Tree Keepers to guide future improvements.

---

## Technical Reference

### Tech Stack

| Category           | Technology                         |
| ------------------ | ---------------------------------- |
| Frontend Framework | Next.js 16 (App Router)            |
| Language           | TypeScript 5                       |
| UI Library         | React 18                           |
| Styling            | Tailwind CSS v4                    |
| Database           | Supabase PostgreSQL                |
| Auth               | Supabase Auth (Magic Links)        |
| Server Functions   | Supabase Edge Functions (Deno)     |
| Email Service      | Resend                             |
| Maps               | Leaflet + React-Leaflet            |
| Search             | Fuse.js (client-side fuzzy search) |

### Database Tables

- `members` — User records with roles, contact info, and tree assignments
- `trees` — Tree inventory with location, status, condition, and maintenance data
- `tasks` — Task records with assignees, completion tracking, and email delivery status
- `reminders` — Recurring reminder configurations with CRON expressions
- `surveys` — Survey submissions with issue details stored as JSONB
- `templates` — Reusable reminder templates

### Key API Routes

**Admin (authenticated):** `/api/admin/{members,trees,tasks,reminders,surveys,templates}` — full CRUD

**Public (no auth):** `/api/public/{trees,tasks,surveys,survey/trees,issue-reports}` — read-only access to public data and survey submission

### Edge Functions

- `tick-reminders` — Fires due reminders and creates tasks
- `send-pending-emails` — Delivers task notification emails via Resend
- `cleanup-completed-tasks` — Daily cleanup of old completed tasks
