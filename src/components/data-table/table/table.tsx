import React from "react";

export default function Table({ className, children }: { className?: string; children?: React.ReactNode }) {
  return (
    <div className="border-2 border-secondary rounded-xl overflow-hidden">
      <table className={`border-collapse ${className || ""}`}>{children}</table>
    </div>
  );
}
