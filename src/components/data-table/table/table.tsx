import React from "react";

type TableProps = {
  className?: string;
  tableClassName?: string;
  children?: React.ReactNode;
};

export default function Table({ className, tableClassName, children }: TableProps) {
  return (
    <div className={`min-h-0 min-w-0 max-w-full border border-secondary rounded-md overflow-auto ${className || ""}`}>
      <table className={`border-collapse w-max min-w-full ${tableClassName || ""}`}>{children}</table>
    </div>
  );
}
