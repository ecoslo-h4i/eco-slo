import { createServiceRoleClient } from "@/lib/supabase/server";

type UpdateMemberEmailResult =
  | { success: true }
  | { success: false; error: string; code: "not_found" | "email_taken" | "auth_failed" | "members_failed" };

type SyncTreeAssignmentsResult = { success: true } | { success: false; error: string };

/**
 * Syncs `trees.tree_keeper_id` and other members' `trees_assigned` arrays
 * to reflect a change in this member's assigned trees.
 *
 * For removed trees: nullifies `tree_keeper_id`.
 * For added trees: sets `tree_keeper_id` to this member, and removes
 * the tree from any other member that previously had it.
 */
export async function syncTreeAssignments(
  memberId: number,
  oldTreeEcosloNumbers: number[],
  newTreeEcosloNumbers: number[],
): Promise<SyncTreeAssignmentsResult> {
  const oldSet = new Set(oldTreeEcosloNumbers);
  const newSet = new Set(newTreeEcosloNumbers);

  const removed = oldTreeEcosloNumbers.filter((n) => !newSet.has(n));
  const added = newTreeEcosloNumbers.filter((n) => !oldSet.has(n));

  if (removed.length === 0 && added.length === 0) return { success: true };

  const supabase = await createServiceRoleClient();

  if (removed.length > 0) {
    const { error } = await supabase.from("trees").update({ tree_keeper_id: null }).in("ecoslo_num", removed);

    if (error) {
      console.error("[syncTreeAssignments] failed to nullify tree_keeper_id for removed trees:", error);
      return { success: false, error: error.message };
    }
  }

  if (added.length > 0) {
    const { error: setKeeperError } = await supabase
      .from("trees")
      .update({ tree_keeper_id: memberId })
      .in("ecoslo_num", added);

    if (setKeeperError) {
      console.error("[syncTreeAssignments] failed to set tree_keeper_id for added trees:", setKeeperError);
      return { success: false, error: setKeeperError.message };
    }

    const { data: affectedMembers, error: lookupError } = await supabase
      .from("members")
      .select("id, trees_assigned")
      .neq("id", memberId)
      .overlaps("trees_assigned", added);

    if (lookupError) {
      console.error("[syncTreeAssignments] failed to find other members with overlapping trees:", lookupError);
      return { success: false, error: lookupError.message };
    }

    const addedSet = new Set(added);
    for (const other of affectedMembers ?? []) {
      const currentTrees: number[] = Array.isArray(other.trees_assigned)
        ? other.trees_assigned.filter((n): n is number => typeof n === "number")
        : [];
      const cleaned = currentTrees.filter((n) => !addedSet.has(n));

      const { error: cleanupError } = await supabase
        .from("members")
        .update({ trees_assigned: cleaned, trees_count: cleaned.length })
        .eq("id", other.id);

      if (cleanupError) {
        console.error("[syncTreeAssignments] failed to clean up member", other.id, cleanupError);
      }
    }
  }

  return { success: true };
}

/**
 * Updates a member's email, keeping auth.users.email in sync if the
 * member has already signed in (i.e., has a linked user_id).
 *
 * Uses the service role and bypasses RLS — callers must gate behind an
 * admin check before invoking.
 *
 * Order of operations:
 *   1. Look up the existing member to get current email + user_id.
 *   2. If email is unchanged, no-op return.
 *   3. If linked, update auth.users.email first. This is where uniqueness
 *      conflicts surface (Supabase enforces unique emails in auth), so
 *      we fail fast before touching members.
 *   4. Update members.email.
 *   5. If step 4 fails after step 3 succeeded, attempt to revert step 3.
 *      If the revert also fails, log loudly — the system is inconsistent
 *      and requires manual reconciliation.
 *
 * The auth.users / members consistency is best-effort, not transactional:
 * the Supabase admin API isn't part of the Postgres connection so we
 * can't wrap them in a single transaction. Failures should be rare in
 * practice.
 */
export async function updateMemberEmail(memberId: number, newEmail: string): Promise<UpdateMemberEmailResult> {
  const normalized = newEmail.trim().toLowerCase();
  const supabase = await createServiceRoleClient();

  const { data: existing, error: lookupError } = await supabase
    .from("members")
    .select("id, email, user_id")
    .eq("id", memberId)
    .maybeSingle();

  if (lookupError) {
    console.error("[updateMemberEmail] member lookup failed:", lookupError);
    return { success: false, error: lookupError.message, code: "members_failed" };
  }
  if (!existing) {
    return { success: false, error: "Member not found.", code: "not_found" };
  }

  // No-op if the email isn't actually changing.
  if (existing.email.toLowerCase() === normalized) {
    return { success: true };
  }

  // Step 1: auth.users.email (only if the member has signed in before).
  // email_confirm: true skips the verification flow — the admin is
  // trusted to make this change on the user's behalf.
  if (existing.user_id) {
    const { error: authError } = await supabase.auth.admin.updateUserById(existing.user_id, {
      email: normalized,
      email_confirm: true,
    });
    if (authError) {
      // The common case here is "email already taken" — another auth.users
      // row has this email. Treat that distinctly so the API can return
      // a 409 instead of a generic 500.
      const isUniqueConflict = /already.*registered|already.*exists|duplicate/i.test(authError.message);
      return {
        success: false,
        error: isUniqueConflict
          ? "Another account already uses that email address."
          : `Auth update failed: ${authError.message}`,
        code: isUniqueConflict ? "email_taken" : "auth_failed",
      };
    }
  }

  // Step 2: members.email.
  const { error: membersError } = await supabase.from("members").update({ email: normalized }).eq("id", memberId);

  if (membersError) {
    // Best-effort revert of step 1.
    if (existing.user_id) {
      const { error: revertError } = await supabase.auth.admin.updateUserById(existing.user_id, {
        email: existing.email,
        email_confirm: true,
      });
      if (revertError) {
        console.error(
          "[updateMemberEmail] CRITICAL: auth/members out of sync for member",
          memberId,
          "auth has new email, members has old. Manual reconciliation required.",
          { authRevertError: revertError, originalMembersError: membersError },
        );
      }
    }

    const isUniqueConflict = membersError.code === "23505"; // Postgres unique_violation
    return {
      success: false,
      error: isUniqueConflict
        ? "Another member already uses that email address."
        : `Members update failed: ${membersError.message}`,
      code: isUniqueConflict ? "email_taken" : "members_failed",
    };
  }

  return { success: true };
}
