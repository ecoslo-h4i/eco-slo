import React from "react";

type TableProps = {
  className?: string;
  tableClassName?: string;
  children?: React.ReactNode;
};

export default function Table({ className, tableClassName, children }: TableProps) {
  return (
    <div className={`min-h-0 min-w-0 max-w-full border border-secondary rounded-md overflow-hidden ${className || ""}`}>
      <div className="size-full min-h-0 w-full min-w-0 max-w-full overflow-auto">
        <table className={`border-collapse w-max min-w-full ${tableClassName || ""}`}>{children}</table>
      </div>
    </div>
  );
}
