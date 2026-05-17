"use client";

import { useState } from "react";

interface LogoutButtonProps {
  className?: string;
  children?: React.ReactNode;
}

export function LogoutButton({ className, children = "Log out" }: LogoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        console.error("Logout failed:", await response.text());
        setIsLoading(false);
        return;
      }

      // Hard navigation rather than router.push so all in-memory client
      // state (Supabase listeners, React Query caches, etc.) is dropped.
      window.location.href = "/login";
    } catch (error) {
      console.error("Logout request failed:", error);
      setIsLoading(false);
    }
  };

  return (
    <button type="button" onClick={handleLogout} disabled={isLoading} className={className}>
      {isLoading ? "Signing out..." : children}
    </button>
  );
}
