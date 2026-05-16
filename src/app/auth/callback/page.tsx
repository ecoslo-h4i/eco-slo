"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createUserLevelClient } from "@/lib/supabase/client";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createUserLevelClient();

    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);

    const access_token = params.get("access_token");
    const refresh_token = params.get("refresh_token");

    if (!access_token || !refresh_token) {
      router.replace("/login?error=auth_failed");
      return;
    }

    supabase.auth.setSession({ access_token, refresh_token }).then(({ error }) => {
      if (error) {
        router.replace("/login?error=auth_failed");
      } else {
        router.replace("/dashboard");
      }
    });
  }, [router]);

  return <p>Signing you in...</p>;
}
