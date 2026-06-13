"use client";

import { useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

interface TooltipProps {
  label: string;
  children: ReactNode;
  className?: string;
}

type Placement = { left: number; top: number; above: boolean };

export function Tooltip({ label, children, className }: TooltipProps) {
  const triggerRef = useRef<HTMLSpanElement>(null);
  const [placement, setPlacement] = useState<Placement | null>(null);

  const show = () => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    // Prefer above; flip below when too close to the top of the viewport.
    const above = rect.top > 56;
    setPlacement({
      left: rect.left + rect.width / 2,
      top: above ? rect.top - 8 : rect.bottom + 8,
      above,
    });
  };
  const hide = () => setPlacement(null);

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
      {placement
        ? createPortal(
            <div
              role="tooltip"
              style={{
                position: "fixed",
                left: placement.left,
                top: placement.top,
                transform: `translateX(-50%) translateY(${placement.above ? "-100%" : "0"})`,
              }}
              className="pointer-events-none z-[60] max-w-xs whitespace-normal break-words rounded-md bg-text-dark px-2.5 py-1.5 text-xs font-medium text-white shadow-md"
            >
              {label}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
