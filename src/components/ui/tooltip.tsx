"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

interface TooltipProps {
  label: string;
  children: ReactNode;
  className?: string;
}

type Anchor = { centerX: number; top: number; bottom: number; above: boolean };

const VIEWPORT_PADDING = 8;

export function Tooltip({ label, children, className }: TooltipProps) {
  const triggerRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [anchor, setAnchor] = useState<Anchor | null>(null);

  const show = () => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setAnchor({
      centerX: rect.left + rect.width / 2,
      top: rect.top,
      bottom: rect.bottom,
      // Prefer above; flip below when too close to the top of the viewport.
      above: rect.top > 56,
    });
  };
  const hide = () => setAnchor(null);

  // Position after render so the tooltip's measured width can be clamped to the
  // viewport. Without this, a chip near a screen edge centers its bubble half
  // off-screen and the text squashes into an unreadable sliver on mobile.
  useLayoutEffect(() => {
    const node = tooltipRef.current;
    if (!anchor || !node) return;

    const width = node.offsetWidth;
    const maxLeft = Math.max(VIEWPORT_PADDING, window.innerWidth - width - VIEWPORT_PADDING);
    const left = Math.min(Math.max(anchor.centerX - width / 2, VIEWPORT_PADDING), maxLeft);

    node.style.left = `${left}px`;
    node.style.top = `${anchor.above ? anchor.top - 8 : anchor.bottom + 8}px`;
    node.style.transform = anchor.above ? "translateY(-100%)" : "none";
    node.style.visibility = "visible";
  }, [anchor]);

  return (
    <>
      <span
        ref={triggerRef}
        title={label}
        onMouseEnter={show}
        onMouseLeave={hide}
        className={cn("cursor-help underline decoration-dotted decoration-text-muted underline-offset-2", className)}
      >
        {children}
      </span>
      {anchor
        ? createPortal(
            <div
              ref={tooltipRef}
              role="tooltip"
              // Rendered hidden at the origin first; the layout effect measures
              // it, clamps it into the viewport, then reveals it.
              style={{ position: "fixed", left: 0, top: 0, visibility: "hidden" }}
              className="pointer-events-none z-[60] max-w-[calc(100vw-16px)] whitespace-normal break-words rounded-md bg-text-dark px-2.5 py-1.5 text-xs font-medium text-white shadow-md sm:max-w-xs"
            >
              {label}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
