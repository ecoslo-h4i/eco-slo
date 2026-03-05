import React from "react";
import { TreeSchema } from "../table-widget-defs";

export default function TableRow({
  className,
  onClick,
  children,
  data,
}: {
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLTableRowElement, MouseEvent>, tree: TreeSchema) => void;
  children?: React.ReactNode;
  data?: TreeSchema;
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
