import React from "react";

export default function TableHeader({ className, children }: { className?: string; children?: React.ReactNode }) {
  return <thead className={`sticky top-0 z-20 ${className || ""}`}>{children}</thead>;
}
