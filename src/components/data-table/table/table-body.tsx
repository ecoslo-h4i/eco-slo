import React from "react";

export default function TableBody({ className, children }: { className?: string; children?: React.ReactNode }) {
  return <tbody className={` divide-y divide-border ${className || ""}`}>{children}</tbody>;
}
