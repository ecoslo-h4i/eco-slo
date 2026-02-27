import React from "react";

type TableProps = {
  className?: string;
  tableClassName?: string;
  children?: React.ReactNode;
};

export default function Table({ className, tableClassName, children }: TableProps) {
  return (
    <div className={`border border-secondary rounded-md overflow-hidden ${className || ""}`}>
      <div className="h-full w-full overflow-auto">
        <table className={`border-collapse min-w-full ${tableClassName || ""}`}>{children}</table>
      </div>
    </div>
  );
}
