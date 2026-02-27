import React from "react";

export default function TableCell({
  position,
  className,
  children,
  columnWidth,
}: {
  position?: "left" | "center" | "right";
  className?: string;
  children?: React.ReactNode;
  columnWidth?: string;
}) {
  return (
    <td className={`px-2 py-1 ${columnWidth || ""} ${className || ""}`}>
      <div
        className={`flex items-center w-full 
          ${position === "center" ? "justify-center" : position === "right" ? "justify-end" : "justify-start"}`}
      >
        {children}
      </div>
    </td>
  );
}
