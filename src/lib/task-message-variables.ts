// Client-side mirror of the per-recipient {firstName}/{treeCount}/{treeNames}
// substitution the send-pending-emails edge function performs. The Tasks
// page displays the same message bodies, so it resolves the same tokens from
// data the browser can read (public_members / public_trees):
//   * tree variables use the task's tree_targets SNAPSHOT when present
//     (Watering/Mulching), else the member's currently kept trees;
//   * unknown or misspelled tokens are left literal, by design.
//
// One UI-only divergence: an email is one (task, recipient) pair, but a group
// task renders as a single card. Admins therefore see the COMBINED values of
// all assignees (names joined, tree counts summed); a tree keeper viewing a
// shared task still sees only their own values, matching the email they got.

import { MESSAGE_VARIABLES, messageVariableToken, type MessageVariable } from "@shared/message-variables";

export type TreeVariableInfo = {
  ecosloNum: number;
  commonName: string | null;
};

export type TaskVariableContext = {
  firstnameById: ReadonlyMap<number, string>;
  treesByKeeperId: ReadonlyMap<number, TreeVariableInfo[]>;
  treeByEcosloNum: ReadonlyMap<number, TreeVariableInfo>;
};

export const EMPTY_TASK_VARIABLE_CONTEXT: TaskVariableContext = {
  firstnameById: new Map(),
  treesByKeeperId: new Map(),
  treeByEcosloNum: new Map(),
};

export function buildTaskVariableContext(
  members: ReadonlyArray<{ id: number | null; firstname: string | null }>,
  trees: ReadonlyArray<{ ecoslo_num: number | null; common_name: string | null; tree_keeper_id: number | null }>,
): TaskVariableContext {
  const firstnameById = new Map<number, string>();
  for (const m of members) {
    if (m.id !== null) firstnameById.set(m.id, m.firstname ?? "");
  }

  const treesByKeeperId = new Map<number, TreeVariableInfo[]>();
  const treeByEcosloNum = new Map<number, TreeVariableInfo>();
  for (const t of trees) {
    if (t.ecoslo_num === null) continue;
    const info: TreeVariableInfo = { ecosloNum: t.ecoslo_num, commonName: t.common_name };
    treeByEcosloNum.set(info.ecosloNum, info);
    if (t.tree_keeper_id !== null) {
      const kept = treesByKeeperId.get(t.tree_keeper_id);
      if (kept) kept.push(info);
      else treesByKeeperId.set(t.tree_keeper_id, [info]);
    }
  }

  return { firstnameById, treesByKeeperId, treeByEcosloNum };
}

/**
 * Whose values a task's message variables should reflect for the current
 * viewer: a tree keeper assigned to the task sees their own values (matching
 * the email they received); admins see every assignee's values combined.
 */
export function resolvePerspectiveMemberIds(
  assignees: readonly number[],
  viewer: { isAdmin: boolean; memberId: number | null },
): number[] {
  if (!viewer.isAdmin && viewer.memberId !== null && assignees.includes(viewer.memberId)) {
    return [viewer.memberId];
  }
  return [...assignees];
}

type TaskForVariables = {
  message: string;
  tree_targets: number[] | null;
};

// Matches the SQL: coalesce(nullif(common_name, ''), 'Tree #' || ecoslo_num).
function treeDisplayName(tree: TreeVariableInfo): string {
  return tree.commonName || `Tree #${tree.ecosloNum}`;
}

function byEcosloNum(a: TreeVariableInfo, b: TreeVariableInfo): number {
  return a.ecosloNum - b.ecosloNum;
}

// The trees the task's tree variables describe: the frozen tree_targets
// snapshot when present (targets pointing at since-deleted trees are dropped
// from names, like the SQL join), else the members' currently kept trees.
function variableTrees(targets: number[] | null, memberIds: number[], ctx: TaskVariableContext): TreeVariableInfo[] {
  const trees = targets
    ? targets.flatMap((num) => ctx.treeByEcosloNum.get(num) ?? [])
    : memberIds.flatMap((id) => ctx.treesByKeeperId.get(id) ?? []);
  return trees.sort(byEcosloNum);
}

// One resolver per supported variable, typed Record<MessageVariable, ...> for
// the same compile-time lockstep the edge function relies on: a new variable
// added to _shared/message-variables.ts won't compile until it's handled here.
const messageVariableResolvers: Record<
  MessageVariable,
  (task: TaskForVariables, memberIds: number[], ctx: TaskVariableContext, targets: number[] | null) => string
> = {
  firstName: (_task, memberIds, ctx) =>
    memberIds
      .map((id) => ctx.firstnameById.get(id) ?? "")
      .filter(Boolean)
      .join(", "),
  // Snapshot count is the snapshot's length even if a target tree has since
  // been deleted — mirrors array_length(tree_targets, 1) in the SQL.
  treeCount: (_task, memberIds, ctx, targets) =>
    String(targets ? targets.length : variableTrees(null, memberIds, ctx).length),
  treeNames: (_task, memberIds, ctx, targets) => variableTrees(targets, memberIds, ctx).map(treeDisplayName).join(", "),
};

/**
 * Replaces each known {token} in the task's message with the values for the
 * given members. Unknown tokens stay literal, matching the email behavior.
 */
export function applyTaskMessageVariables(
  task: TaskForVariables,
  memberIds: number[],
  context: TaskVariableContext,
): string {
  if (!task.message.includes("{")) return task.message;

  // tree_targets is null or non-empty in practice; treat an empty array like
  // null so the fallback matches array_length(...) being null in the SQL.
  const targets = task.tree_targets?.length ? task.tree_targets : null;

  let result = task.message;
  for (const name of MESSAGE_VARIABLES) {
    const token = messageVariableToken(name);
    if (!result.includes(token)) continue;
    result = result.replaceAll(token, messageVariableResolvers[name](task, memberIds, context, targets));
  }
  return result;
}
