import React from "react";

export default function TableHeader({ className, children }: { className?: string; children?: React.ReactNode }) {
  return <thead className={`${className || ""}`}>{children}</thead>;
}
