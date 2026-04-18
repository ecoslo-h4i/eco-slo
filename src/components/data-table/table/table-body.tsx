import React from "react";

export default function TableBody({ className, children }: { className?: string; children?: React.ReactNode }) {
  return <tbody className={`${className || ""}`}>{children}</tbody>;
}
