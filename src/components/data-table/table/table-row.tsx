import React from "react";

export default function TableRow<T extends Record<string, unknown>>({
  className,
  onClick,
  children,
  data,
}: {
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLTableRowElement, MouseEvent>, tree: T) => void;
  children?: React.ReactNode;
  data?: T;
}) {
  return (
    <tr
      className={`${className || ""}`}
      onClick={(e) => {
        onClick && data ? onClick(e, data) : {};
      }}
    >
      {children}
    </tr>
  );
}
