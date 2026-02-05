import React from "react";

export default function TableBody({ className, children }: { className?: string; children?: React.ReactNode }) {
  return <tbody className={` divide-y divide-secondary ${className || ""}`}>{children}</tbody>;
}
