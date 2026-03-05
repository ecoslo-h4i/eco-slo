import React from "react";

export default function TableRow({
  className,
  onClick,
  children,
}: {
  className?: string;
  onClick?: () => void;
  children?: React.ReactNode;
}) {
  return (
    <tr className={`${className || ""}`} onClick={onClick}>
      {children}
    </tr>
  );
}
