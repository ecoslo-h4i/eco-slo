import React from "react";

export default function TableCell({
  position,
  className,
  children,
}: {
  position?: "left" | "center" | "right";
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <td className={`px-4 py-2 ${className || ""}`}>
      <div
        className={`flex items-center w-full 
          ${position === "center" ? "justify-center" : position === "right" ? "justify-end" : "justify-start"}`}
      >
        {children}
      </div>
    </td>
  );
}
