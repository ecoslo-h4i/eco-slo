"use client";

import { useEffect, useState } from "react";
import { createUserLevelClient } from "@/lib/supabase/client";
import type { Tables } from "@/database/database.types";

type Member = Tables<"members">;

interface UseCurrentMemberResult {
  member: Member | null;
  loading: boolean;
  error: Error | null;
  isAdmin: boolean;
  isTreeKeeper: boolean;
}

/**
 * Fetches the current authenticated member.
 *
 * Relies on the `members_self_select` RLS policy, which allows any
 * authenticated member to read their own row (where user_id = auth.uid()).
 *
 * Returns `member: null` if the user is unauthenticated or has no linked
 * members row (which shouldn't happen in normal flow — the callback page
 * signs them out if linkage is missing).
 */
export function useCurrentMember(): UseCurrentMemberResult {
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    const supabase = createUserLevelClient();

    const fetchMember = async () => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (cancelled) return;

      if (userError || !user) {
        setMember(null);
        setError(userError ? new Error(userError.message) : null);
        setLoading(false);
        return;
      }

      const { data, error: queryError } = await supabase
        .from("members")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (cancelled) return;

      if (queryError) {
        setError(new Error(queryError.message));
        setMember(null);
      } else {
        setMember(data);
        setError(null);
      }
      setLoading(false);
    };

    void fetchMember();

    // Re-fetch on auth state changes so the hook stays in sync if the user
    // signs out in another tab or the session refreshes.
    const { data: subscription } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        setMember(null);
        setLoading(false);
        return;
      }
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        setLoading(true);
        void fetchMember();
      }
    });

    return () => {
      cancelled = true;
      subscription.subscription.unsubscribe();
    };
  }, []);

  return {
    member,
    loading,
    error,
    isAdmin: member?.role === "Admin",
    isTreeKeeper: member?.role === "Tree Keeper",
  };
}
