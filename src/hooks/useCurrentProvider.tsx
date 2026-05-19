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

    const fetchMember = async () => {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (cancelled) return;

      if (sessionError || !session?.user) {
        setMember(null);
        setError(sessionError ? new Error(sessionError.message) : null);
        setLoading(false);
        return;
      }

      const { data, error: queryError } = await supabase
        .from("members")
        .select("*")
        .eq("user_id", session.user.id)
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
