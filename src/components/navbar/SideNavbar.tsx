"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import NavbarButton, { NavbarButtonProps } from "./SideNavbarButton";

const buttons: NavbarButtonProps[] = [
  { icon: "/icons/home.svg", label: "Dashboard", link: "/dashboard" },
  { icon: "/icons/tree.svg", label: "Trees", link: "/trees" },
  { icon: "/icons/volunteers.svg", label: "Members", link: "/members" },
  { icon: "/icons/calendar.svg", label: "Reminders", link: "/reminders" },
  { icon: "/icons/analytics.svg", label: "Tasks", link: "/tasks" },
  { icon: "/icons/pen-paper.svg", label: "Surveys", link: "/survey" },
  { icon: "/icons/map.svg", label: "Map", link: "/map" },
];

const NAV_ITEM_HEIGHT = 88;
const NAV_ITEM_GAP = 16;

export default function SideNavbar() {
  const navListRef = useRef<HTMLDivElement>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const [visibleButtonCount, setVisibleButtonCount] = useState(buttons.length);
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  // Set up resize observer that continuously updates the button view based on viewport size
  useEffect(() => {
    const navList = navListRef.current;

    if (!navList) {
      return;
    }

    const updateVisibleButtonCount = () => {
      const capacity = Math.floor((navList.clientHeight + NAV_ITEM_GAP) / (NAV_ITEM_HEIGHT + NAV_ITEM_GAP));

      if (capacity >= buttons.length) {
        setVisibleButtonCount(buttons.length);
        setIsMoreOpen(false);
        return;
      }

      setVisibleButtonCount(Math.max(capacity - 1, 0));
    };

    updateVisibleButtonCount();

    const resizeObserver = new ResizeObserver(updateVisibleButtonCount);
    resizeObserver.observe(navList);

    return () => resizeObserver.disconnect();
  }, []);

  // When more menu opens, open listener for KBM events to see if user closes it
  useEffect(() => {
    if (!isMoreOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (!moreMenuRef.current?.contains(event.target as Node)) {
        setIsMoreOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMoreOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMoreOpen]);

  const visibleButtons = useMemo(() => buttons.slice(0, visibleButtonCount), [visibleButtonCount]);
  const overflowButtons = useMemo(() => buttons.slice(visibleButtonCount), [visibleButtonCount]);

  return (
    <div className="flex h-screen w-35 flex-col gap-6 bg-primary px-5 py-6 sticky top-0">
      <div className="flex flex-col items-center justify-center gap-5">
        <div className="w-24.5 h-24.5 flex items-center justify-center">
          <Image
            src="/icons/ecoslo-logo.png"
            width={98}
            height={98}
            alt="EcoSLO Logo"
            className="h-full w-full object-contain"
          />
        </div>
        <a
          href="/login"
          className="flex items-center justify-center bg-white text-black rounded-full w-28 h-[39px] px-4 py-2.5 text-sm font-avenir font-normal hover:bg-gray-200 transition-colors duration-200 cursor-pointer"
        >
          <span>Log out</span>
        </a>
      </div>
      <div ref={navListRef} className="flex min-h-0 flex-grow flex-col items-center gap-4">
        {visibleButtons.map((button) => (
          <NavbarButton key={button.label} {...button} />
        ))}
        {overflowButtons.length > 0 && (
          <div ref={moreMenuRef} className="relative">
            {isMoreOpen && (
              <div className="fixed bottom-6 left-35 z-50 ml-3 flex max-h-[calc(100dvh-48px)] flex-col gap-4 overflow-y-auto rounded-2xl border border-white/20 bg-primary p-3">
                {overflowButtons.map((button) => (
                  <NavbarButton key={button.label} {...button} />
                ))}
              </div>
            )}
            <NavbarButton icon="/icons/ellipsis.svg" label="More" onClick={() => setIsMoreOpen((open) => !open)} />
          </div>
        )}
      </div>
    </div>
  );
}
