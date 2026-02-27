import React from "react";

export default function TableHead({
  className,
  children,
  position,
  columnWidth,
}: {
  className?: string;
  children?: React.ReactNode;
  position?: "left" | "center" | "right";
  columnWidth?: string;
}) {
  return (
    <th
      className={`px-2 py-1
        sticky top-0 z-20 bg-card
        ${columnWidth || ""}
        ${position === "center" ? "text-center" : position === "right" ? "text-right" : "text-left"}
        ${className || ""}`}
      style={{ boxShadow: "inset 0 -1px 0 0 var(--color-secondary)" }}
    >
      {children}
    </th>
  );
}
