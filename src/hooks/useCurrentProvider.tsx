"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { createUserLevelClient } from "@/lib/supabase/client";
import type { Tables } from "@/database/database.types";

type Member = Tables<"members">;

interface CurrentMemberContextValue {
  member: Member | null;
  loading: boolean;
  error: Error | null;
  isAdmin: boolean;
  isTreeKeeper: boolean;
}

const CurrentMemberContext = createContext<CurrentMemberContextValue | null>(null);

/**
 * Provides the current authenticated member to descendant components.
 *
 * Fetched once per layout render and shared via context, so every component
 * that calls useCurrentMember() reads from the same source instead of
 * triggering its own fetch.
 *
 * Uses supabase.auth.getSession(), which reads the session locally from
 * cookies/storage auth server. RLS still validates every data query.
 */
export function CurrentMemberProvider({ children }: { children: ReactNode }) {
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    const supabase = createUserLevelClient();

    // The member is keyed on the authenticated user's id. Track the id we last
    // loaded so we only refetch when the *identity* changes.
    let loadedUserId: string | null | undefined = undefined;

    const loadMemberFor = async (userId: string) => {
      const { data, error: queryError } = await supabase
        .from("members")
        .select("*")
        .eq("user_id", userId)
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

    // React only to a change in who is signed in. Same user (including a token
    // refresh) is a no-op, so the UI never churns back into a loading state.
    const syncUser = (userId: string | null) => {
      if (userId === loadedUserId) return;
      loadedUserId = userId;

      if (!userId) {
        setMember(null);
        setError(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      void loadMemberFor(userId);
    };

    // Initial read, wrapped so a thrown/rejected getSession can't strand
    // `loading` at true and hang the shell on a blank state.
    void (async () => {
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();
        if (cancelled) return;

        if (sessionError) {
          setError(new Error(sessionError.message));
          setMember(null);
          setLoading(false);
          return;
        }
        syncUser(session?.user?.id ?? null);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err : new Error(String(err)));
        setMember(null);
        setLoading(false);
      }
    })();

    // Use the session handed to the callback rather than calling getSession()
    // again here
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      if (cancelled) return;
      syncUser(session?.user?.id ?? null);
    });

    return () => {
      cancelled = true;
      subscription.subscription.unsubscribe();
    };
  }, []);

  const value: CurrentMemberContextValue = {
    member,
    loading,
    error,
    isAdmin: member?.role === "Admin",
    isTreeKeeper: member?.role === "Tree Keeper",
  };

  return <CurrentMemberContext.Provider value={value}>{children}</CurrentMemberContext.Provider>;
}

/**
 * Reads the current authenticated member from CurrentMemberProvider context.
 * Must be used inside a tree wrapped by CurrentMemberProvider; throws
 * otherwise to make missing-provider bugs loud at development time.
 */
export function useCurrentMember(): CurrentMemberContextValue {
  const context = useContext(CurrentMemberContext);
  if (context === null) {
    throw new Error("useCurrentMember must be used within a CurrentMemberProvider");
  }
  return context;
}
