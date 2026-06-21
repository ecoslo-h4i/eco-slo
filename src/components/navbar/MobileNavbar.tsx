"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { LogIn, LogOut, Map, Menu, X } from "lucide-react";
import { LogoutButton } from "../LogoutButton";
import { useCurrentMember } from "@/hooks/useCurrentProvider";
import { appButtonClassName } from "@/components/ui/form-controls";
import { getVisibleNavItems } from "./nav-items";
import { cn } from "@/lib/utils";

// Mobile replacement for the desktop sidebar: a sage-green top bar with the
// logo on the left and either a hamburger (signed in) or a Login/Map pill
// (signed out) on the right. The hamburger opens a right-side drawer with the
// same nav items the sidebar shows, plus Logout.
export default function MobileNavbar({ className }: { className?: string }) {
  const pathname = usePathname();
  const { member, loading, isAdmin } = useCurrentMember();

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const navItems = getVisibleNavItems(Boolean(member), isAdmin);

  // While the drawer is open: lock background scroll, close on Escape, and
  // move focus to the close button so keyboard users aren't stranded behind
  // the overlay.
  useEffect(() => {
    if (!isDrawerOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsDrawerOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);

    closeButtonRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isDrawerOpen]);

  // Signed-out users have no nav items, so the bar shows the relevant account
  // action directly instead of a hamburger (mirrors the desktop sidebar's
  // bottom slot).
  const loggedOutAction =
    pathname === "/login" ? (
      <Link href="/map" className={appButtonClassName({ size: "sm", variant: "secondary" })}>
        <Map aria-hidden="true" className="h-4 w-4" strokeWidth={2} />
        <span>Map</span>
      </Link>
    ) : (
      <Link href="/login" className={appButtonClassName({ size: "sm", variant: "secondary" })}>
        <LogIn aria-hidden="true" className="h-4 w-4" strokeWidth={2} />
        <span>Login</span>
      </Link>
    );

  return (
    <div className={cn("shrink-0", className)}>
      <header className="flex h-16 items-center justify-between bg-primary px-4">
        <Link href="/" className="flex items-center" aria-label="ECOSLO home">
          <Image
            src="/icons/ecoslo-logo.png"
            width={44}
            height={44}
            alt="EcoSLO Logo"
            className="h-11 w-11 object-contain"
          />
        </Link>
        {loading ? null : member ? (
          <button
            type="button"
            className="grid h-11 w-11 cursor-pointer place-items-center rounded-xl text-on-primary transition-colors hover:bg-primary-hover"
            onClick={() => setIsDrawerOpen(true)}
            aria-label="Open navigation menu"
            aria-expanded={isDrawerOpen}
          >
            <Menu aria-hidden="true" className="h-6 w-6" strokeWidth={2} />
          </button>
        ) : (
          loggedOutAction
        )}
      </header>

      {isDrawerOpen ? (
        <div className="fixed inset-0 z-60" role="dialog" aria-modal="true" aria-label="Navigation menu">
          <button
            type="button"
            className="absolute inset-0 h-full w-full cursor-default bg-text/45"
            aria-label="Close navigation menu"
            onClick={() => setIsDrawerOpen(false)}
          />
          <div className="absolute right-0 top-0 flex h-full w-72 max-w-[85vw] flex-col overflow-y-auto overscroll-contain rounded-l-3xl bg-primary p-5">
            <div className="mb-4 flex items-center justify-between">
              <Image
                src="/icons/ecoslo-logo.png"
                width={40}
                height={40}
                alt="EcoSLO Logo"
                className="h-10 w-10 object-contain"
              />
              <button
                ref={closeButtonRef}
                type="button"
                className="grid h-11 w-11 cursor-pointer place-items-center rounded-xl text-on-primary transition-colors hover:bg-primary-hover"
                onClick={() => setIsDrawerOpen(false)}
                aria-label="Close navigation menu"
              >
                <X aria-hidden="true" className="h-6 w-6" strokeWidth={2} />
              </button>
            </div>

            <nav className="flex flex-col gap-1.5">
              {navItems.map((item) => {
                const isActive = pathname === item.link || pathname.startsWith(`${item.link}/`);

                return (
                  <Link
                    key={item.label}
                    href={item.link}
                    onClick={() => setIsDrawerOpen(false)}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "flex min-h-12 items-center gap-3 rounded-2xl px-4 py-3 font-mulish text-base text-on-primary transition-colors hover:bg-primary-hover",
                      isActive && "bg-primary-hover font-semibold",
                    )}
                  >
                    <item.icon aria-hidden="true" className="h-5 w-5" strokeWidth={1.75} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="mt-auto pt-6">
              <LogoutButton className={appButtonClassName({ className: "w-full", variant: "secondary" })}>
                <LogOut aria-hidden="true" className="h-4 w-4" strokeWidth={2} />
                <span>Logout</span>
              </LogoutButton>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
