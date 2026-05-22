"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ListChecks,
  Calendar,
  Ellipsis,
  LayoutDashboard,
  LogIn,
  LogOut,
  Map,
  MapPin,
  TreeDeciduous,
  UsersRound,
} from "lucide-react";
import NavbarButton, { NavbarButtonProps } from "./SideNavbarButton";
import { LogoutButton } from "../LogoutButton";
import { useCurrentMember } from "@/hooks/useCurrentProvider";
import { appButtonClassName } from "@/components/ui/form-controls";

// All possible feature buttons. Filtered by role at render time.
// `adminOnly` flags entries hidden from Tree Keepers because RLS prevents
// them from doing meaningful work on those pages (Reminders are admin-only;
// Members would just show their own row).
type FeatureButton = NavbarButtonProps & { adminOnly?: boolean };

const allFeatureButtons: FeatureButton[] = [
  { icon: LayoutDashboard, label: "Dashboard", link: "/dashboard" },
  { icon: TreeDeciduous, label: "Trees", link: "/trees" },
  { icon: UsersRound, label: "Members", link: "/members", adminOnly: true },
  { icon: Calendar, label: "Reminders", link: "/reminders", adminOnly: true },
  { icon: ListChecks, label: "Tasks", link: "/tasks" },
  { icon: MapPin, label: "Map", link: "/map" },
];

const NAV_ITEM_HEIGHT = 88;
const NAV_ITEM_GAP = 16;

export default function SideNavbar() {
  const pathname = usePathname();
  const { member, loading, isAdmin } = useCurrentMember();

  const navListRef = useRef<HTMLDivElement>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const [visibleButtonCount, setVisibleButtonCount] = useState(0);
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  // Compute which buttons to show based on auth + role. Memoized so the
  // resize observer effect below doesn't re-run on every render.
  const featureButtons = useMemo<FeatureButton[]>(() => {
    if (!member) return [];
    return allFeatureButtons.filter((button) => !button.adminOnly || isAdmin);
  }, [member, isAdmin]);

  // Resize observer: figure out how many buttons fit in the available space.
  // When the list overflows, the last visible slot becomes a "More" button.
  useEffect(() => {
    const navList = navListRef.current;
    if (!navList) return;

    const updateVisibleButtonCount = () => {
      const capacity = Math.floor((navList.clientHeight + NAV_ITEM_GAP) / (NAV_ITEM_HEIGHT + NAV_ITEM_GAP));

      if (capacity >= featureButtons.length) {
        setVisibleButtonCount(featureButtons.length);
        setIsMoreOpen(false);
        return;
      }

      setVisibleButtonCount(Math.max(capacity - 1, 0));
    };

    updateVisibleButtonCount();

    const resizeObserver = new ResizeObserver(updateVisibleButtonCount);
    resizeObserver.observe(navList);

    return () => resizeObserver.disconnect();
  }, [featureButtons.length]);

  // Close the More menu when clicking outside or pressing Escape.
  useEffect(() => {
    if (!isMoreOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!moreMenuRef.current?.contains(event.target as Node)) {
        setIsMoreOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsMoreOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMoreOpen]);

  const visibleButtons = useMemo(
    () => featureButtons.slice(0, visibleButtonCount),
    [featureButtons, visibleButtonCount],
  );
  const overflowButtons = useMemo(() => featureButtons.slice(visibleButtonCount), [featureButtons, visibleButtonCount]);

  // Decide what to render in the bottom "action" slot — the area that holds
  // either the Login link, the Back-to-Map link, or the Logout button.
  const bottomAction = (() => {
    // While the auth check is in flight, render nothing here. The logo
    // above still renders, so the layout doesn't jump. Once resolved,
    // the right button slots in.
    if (loading) return null;

    if (member) {
      return (
        <LogoutButton className={appButtonClassName({ className: "w-28", size: "sm", variant: "secondary" })}>
          <LogOut aria-hidden="true" className="h-4 w-4" strokeWidth={2} />
          <span>Logout</span>
        </LogoutButton>
      );
    }

    if (pathname === "/login") {
      return (
        <Link href="/map" className={appButtonClassName({ className: "w-28", size: "sm", variant: "secondary" })}>
          <Map aria-hidden="true" className="h-4 w-4" strokeWidth={2} />
          <span>Map</span>
        </Link>
      );
    }

    // Default for logged-out users on any other public page (notably /map).
    return (
      <Link href="/login" className={appButtonClassName({ className: "w-28", size: "sm", variant: "secondary" })}>
        <LogIn aria-hidden="true" className="h-4 w-4" strokeWidth={2} />
        <span>Login</span>
      </Link>
    );
  })();

  return (
    <div className="sticky top-0 z-60 flex h-screen w-35 flex-col bg-primary px-5 py-6">
      <div className="flex flex-col items-center justify-center">
        <div className="w-24.5 h-24.5 flex items-center justify-center">
          <Image
            src="/icons/ecoslo-logo.png"
            width={98}
            height={98}
            alt="EcoSLO Logo"
            className="h-full w-full object-contain"
          />
        </div>
      </div>

      <div ref={navListRef} className="mt-6 flex min-h-0 flex-grow flex-col items-center gap-4">
        {visibleButtons.map((button) => (
          <NavbarButton key={button.label} {...button} />
        ))}
        {overflowButtons.length > 0 && (
          <div ref={moreMenuRef} className="relative">
            {isMoreOpen && (
              <div className="fixed bottom-6 left-35 z-60 ml-3 flex max-h-[calc(100dvh-48px)] flex-col gap-4 overflow-y-auto rounded-2xl border border-card/20 bg-primary p-3">
                {overflowButtons.map((button) => (
                  <NavbarButton key={button.label} {...button} />
                ))}
              </div>
            )}
            <NavbarButton icon={Ellipsis} label="More" onClick={() => setIsMoreOpen((open) => !open)} />
          </div>
        )}
      </div>

      <div className="mt-6 flex shrink-0 justify-center">{bottomAction}</div>
    </div>
  );
}
