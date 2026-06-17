// Client-side mirror of the per-recipient {firstName}/{treeCount}/{treeNames}
// substitution the send-pending-emails edge function performs. The Tasks
// page displays the same message bodies, so it resolves the same tokens from
// data the browser can read (public_members / public_trees):
//   * tree variables use the task's tree_targets SNAPSHOT when present
//     (Watering/Mulching), else the member's currently kept trees;
//   * unknown or misspelled tokens are left literal, by design.
//
// One UI-only divergence: an email is one (task, recipient) pair, but a group
// task (>1 assignee) renders as a single card. There it shows one anchor
// member's value followed by "+N others". The anchor is the viewer when
// they're an assignee, otherwise the first assignee. The chip is hoverable
// and displays a tooltip. applyTaskMessageVariables keeps returning the
// fully-combined plain string, used for search/CSV.

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

// Segmented rendering for the Tasks page
export type MessageSegment = { kind: "text"; text: string } | { kind: "chip"; text: string; tooltip: string };

type GroupTask = TaskForVariables & { assignees: number[] | null };

// "Bob" + 2 -> "Bob +2 others"; "Bob" + 1 -> "Bob +1 other";
// "Bob" + 0 -> "Bob" (nothing extra); "" + 5 -> "+5 others" (anchor has none).
function withOthersSuffix(anchorValue: string, otherCount: number): string {
  if (otherCount <= 0) return anchorValue;
  const suffix = `+${otherCount} ${otherCount === 1 ? "other" : "others"}`;
  return anchorValue ? `${anchorValue} ${suffix}` : suffix;
}

// How one variable renders inside a group task: `text` is what's shown; when
// `tooltip` is set the segment becomes a hover chip revealing every member's
// value. otherCount can be 0 for tree variables (the other members keep no
// trees), in which case there's nothing extra to reveal and it stays text.
type GroupVariableRender = { text: string; tooltip?: string };

function groupVariableRenders(
  assignees: number[],
  anchorId: number,
  ctx: TaskVariableContext,
): Record<MessageVariable, GroupVariableRender> {
  const firstnameOf = (id: number) => ctx.firstnameById.get(id) ?? "";
  const treeCountOf = (id: number) => (ctx.treesByKeeperId.get(id) ?? []).length;
  const treesOf = (id: number) => [...(ctx.treesByKeeperId.get(id) ?? [])].sort(byEcosloNum);
  const allTrees = assignees.flatMap((id) => ctx.treesByKeeperId.get(id) ?? []).sort(byEcosloNum);

  const anchorTrees = treesOf(anchorId);
  const otherTreeCount = allTrees.length - anchorTrees.length;

  return {
    // Anchor's first name + count of the OTHER members; tooltip lists everyone
    // in assignee order.
    firstName: {
      text: withOthersSuffix(firstnameOf(anchorId), assignees.length - 1),
      tooltip: assignees.map(firstnameOf).filter(Boolean).join(", "),
    },
    // Anchor's tree count + count of every OTHER member's trees; tooltip breaks
    // the total down per member so the numbers are accountable.
    treeCount: {
      text: withOthersSuffix(String(anchorTrees.length), otherTreeCount),
      tooltip:
        otherTreeCount > 0
          ? assignees.map((id) => `${firstnameOf(id) || "Unknown"}: ${treeCountOf(id)}`).join(", ")
          : undefined,
    },
    // Anchor's tree names + count of the OTHER trees; tooltip lists them all.
    treeNames: {
      text: withOthersSuffix(anchorTrees.map(treeDisplayName).join(", "), otherTreeCount),
      tooltip: otherTreeCount > 0 ? allTrees.map(treeDisplayName).join(", ") : undefined,
    },
  };
}

const TOKEN_SPLIT_PATTERN = new RegExp(
  `(${MESSAGE_VARIABLES.map((name) => messageVariableToken(name).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`,
);
const TOKEN_TO_VARIABLE = new Map<string, MessageVariable>(
  MESSAGE_VARIABLES.map((name) => [messageVariableToken(name), name]),
);

/**
 * Splits a task's message into renderable segments. Non-group tasks collapse to a
 * single plain-text segment via applyTaskMessageVariables. Group tasks anchor
 * each variable on the viewer (or the first assignee) and turn it into a "+N
 * others" chip; unknown tokens stay literal in either case.
 */
export function buildTaskMessageSegments(
  task: GroupTask,
  viewer: { memberId: number | null },
  context: TaskVariableContext,
): MessageSegment[] {
  const assignees = task.assignees ?? [];

  if (assignees.length <= 1) {
    return [{ kind: "text", text: applyTaskMessageVariables(task, assignees, context) }];
  }

  const anchorId = viewer.memberId !== null && assignees.includes(viewer.memberId) ? viewer.memberId : assignees[0];
  const renders = groupVariableRenders(assignees, anchorId, context);

  const segments: MessageSegment[] = [];
  for (const part of task.message.split(TOKEN_SPLIT_PATTERN)) {
    if (part === "") continue;
    const variable = TOKEN_TO_VARIABLE.get(part);
    if (!variable) {
      segments.push({ kind: "text", text: part });
      continue;
    }
    const render = renders[variable];
    segments.push(
      render.tooltip
        ? { kind: "chip", text: render.text, tooltip: render.tooltip }
        : { kind: "text", text: render.text },
    );
  }
  return segments;
}
