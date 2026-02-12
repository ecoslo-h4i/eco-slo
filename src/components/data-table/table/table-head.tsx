import React from "react";

export default function TableHead({
  className,
  children,
  position,
}: {
  className?: string;
  children?: React.ReactNode;
  position?: "left" | "center" | "right";
}) {
  return (
    <th
      className={`px-4 py-2
        ${position === "center" ? "text-center" : position === "right" ? "text-right" : "text-left"}
        ${className || ""}`}
    >
      {children}
    </th>
  );
}
