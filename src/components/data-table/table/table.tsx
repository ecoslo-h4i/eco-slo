import React from "react";

type TableProps = {
  className?: string;
  tableClassName?: string;
  footer?: boolean;
  footerClassName?: string;
  footerContent?: React.ReactNode;
  children?: React.ReactNode;
};

export default function Table({
  className,
  tableClassName,
  footer,
  footerClassName,
  footerContent,
  children,
}: TableProps) {
  return (
    <div className={`min-h-0 min-w-0 max-w-full border border-border overflow-hidden flex flex-col ${className || ""}`}>
      <div className="min-h-0 min-w-0 max-w-full overflow-auto">
        <table className={`border-collapse w-max min-w-full ${tableClassName || ""}`}>{children}</table>
      </div>
      {footer && <div className={`flex-shrink-0 border-t border-border ${footerClassName || ""}`}>{footerContent}</div>}
    </div>
  );
}
