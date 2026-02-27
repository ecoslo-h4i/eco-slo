import React from "react";

export default function TableRow({ className, children }: { className?: string; children?: React.ReactNode }) {
  return <tr className={`${className || ""}`}>{children}</tr>;
}
