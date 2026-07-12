import { SurveySchema } from "@/components/data-table/table-widget-defs";
import { surveyIssueLabel } from "@/types/survey";
import { createUserLevelClient } from "./supabase/client";

const EMPTY_SUBMITTER = { name: "", email: "", phone: "" };

function treeLabel(ecoslo_num: number, common_name: string | null, species_name: string | null): string {
  const primary = common_name?.trim() || species_name?.trim() || "Tree";
  return `#${ecoslo_num} — ${primary}`;
}

/**
 * Fetches surveys for the Surveys dashboard.
 *
 * RLS scopes the base query (admins: all rows; Tree Keepers: surveys related
 * to their tasks/trees plus their own submissions). Pass `onlySubmittedBy` to
 * narrow to a member's own submissions — the dashboard does this for
 * non-admins so the page lists exactly what they submitted.
 */
export async function getSurveys(options: { onlySubmittedBy?: number | null } = {}): Promise<SurveySchema[]> {
  const supabase = createUserLevelClient();

  let query = supabase
    .from("surveys")
    .select("id, created_at, issue, issue_other, image_link, notes, admin_contact, tree, task, submitted_by")
    .order("created_at", { ascending: false });

  if (options.onlySubmittedBy != null) {
    query = query.eq("submitted_by", options.onlySubmittedBy);
  }

  const { data: surveys, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  if (!surveys || surveys.length === 0) return [];

  // Batch-resolve display labels for linked trees, tasks, and submitters.
  // RLS may hide referenced rows (e.g. a tree reassigned away from a keeper);
  // those fall back to bare labels rather than failing.
  const treeNums = Array.from(new Set(surveys.map((s) => s.tree).filter((num): num is number => num !== null)));
  const taskIds = Array.from(new Set(surveys.map((s) => s.task).filter((id): id is number => id !== null)));
  const memberIds = Array.from(new Set(surveys.map((s) => s.submitted_by).filter((id): id is number => id !== null)));

  const treeLabelByNum = new Map<number, string>();
  if (treeNums.length > 0) {
    const { data: trees, error: treesError } = await supabase
      .from("trees")
      .select("ecoslo_num, common_name, species_name")
      .in("ecoslo_num", treeNums);

    if (treesError) {
      console.error("[getSurveys] failed to fetch tree info:", treesError);
    } else {
      for (const tree of trees ?? []) {
        treeLabelByNum.set(tree.ecoslo_num, treeLabel(tree.ecoslo_num, tree.common_name, tree.species_name));
      }
    }
  }

  const taskTitleById = new Map<number, string>();
  if (taskIds.length > 0) {
    const { data: tasks, error: tasksError } = await supabase.from("tasks").select("id, title").in("id", taskIds);

    if (tasksError) {
      console.error("[getSurveys] failed to fetch task info:", tasksError);
    } else {
      for (const task of tasks ?? []) {
        taskTitleById.set(task.id, task.title ?? "");
      }
    }
  }

  const submitterById = new Map<number, SurveySchema["submitter"]>();
  if (memberIds.length > 0) {
    const { data: members, error: membersError } = await supabase
      .from("members")
      .select("id, firstname, lastname, email, phone")
      .in("id", memberIds);

    if (membersError) {
      console.error("[getSurveys] failed to fetch submitter info:", membersError);
    } else {
      for (const member of members ?? []) {
        submitterById.set(member.id, {
          name: `${member.firstname} ${member.lastname}`.trim(),
          email: member.email ?? "",
          phone: member.phone ?? "",
        });
      }
    }
  }

  return surveys.map((survey) => ({
    id: survey.id,
    created_at: survey.created_at,
    issue: survey.issue,
    issue_label: surveyIssueLabel(survey.issue),
    issue_other: survey.issue_other,
    image_link: survey.image_link,
    notes: survey.notes,
    admin_contact: survey.admin_contact,
    tree: survey.tree,
    tree_label: survey.tree !== null ? (treeLabelByNum.get(survey.tree) ?? `#${survey.tree}`) : "",
    task: survey.task,
    task_title: survey.task !== null ? (taskTitleById.get(survey.task) ?? "") : "",
    submitted_by: survey.submitted_by,
    submitter:
      survey.submitted_by !== null ? (submitterById.get(survey.submitted_by) ?? EMPTY_SUBMITTER) : EMPTY_SUBMITTER,
  }));
}
