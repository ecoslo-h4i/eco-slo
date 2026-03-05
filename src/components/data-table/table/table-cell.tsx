import React from "react";

export default function TableCell({
  position,
  className,
  children,
  columnWidth,
  columnSpan,
}: {
  position?: "left" | "center" | "right";
  className?: string;
  children?: React.ReactNode;
  columnWidth?: string;
  columnSpan?: number;
}) {
  return (
    <td className={`px-2 py-1.5 ${columnWidth || ""} ${className || ""}`} colSpan={columnSpan}>
      <div
        className={`flex items-center w-full 
          ${position === "center" ? "justify-center" : position === "right" ? "justify-end" : "justify-start"}`}
      >
        {children}
      </div>
    </td>
  );
}
