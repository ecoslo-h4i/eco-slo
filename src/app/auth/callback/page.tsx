"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createUserLevelClient } from "@/lib/supabase/client";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const run = async () => {
      const supabase = createUserLevelClient();

      const hash = window.location.hash.substring(1);
      const params = new URLSearchParams(hash);
      const access_token = params.get("access_token");
      const refresh_token = params.get("refresh_token");

      if (!access_token || !refresh_token) {
        router.replace("/login?error=auth_failed");
        return;
      }

      const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
        access_token,
        refresh_token,
      });
      if (sessionError || !sessionData.user) {
        router.replace("/login?error=auth_failed");
        return;
      }

      // Double check for edge cases (member deleted between requests, trigger failures,
      // stale auth.users row, etc.) where the session is valid but every authenticated
      // query would fail RLS
      const { data: member, error: memberError } = await supabase
        .from("members")
        .select("id")
        .eq("user_id", sessionData.user.id)
        .maybeSingle();

      if (memberError || !member) {
        await supabase.auth.signOut();
        router.replace("/login?error=not_linked");
        return;
      }

      router.replace("/dashboard");
    };

    void run();
  }, [router]);

  return <p>Signing you in...</p>;
}
