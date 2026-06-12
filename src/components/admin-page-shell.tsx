import { cn } from "@/lib/utils";
import type { MouseEventHandler, ReactNode } from "react";

type AdminPageShellProps = {
  actions?: ReactNode;
  beforeContent?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  headerClassName?: string;
  onClick?: MouseEventHandler<HTMLElement>;
  title: ReactNode;
  titleClassName?: string;
};

export function AdminPageShell({
  actions,
  beforeContent,
  children,
  className,
  contentClassName,
  headerClassName,
  onClick,
  title,
  titleClassName,
}: AdminPageShellProps) {
  return (
    <main className={cn("flex-1 min-w-0 min-h-full bg-background", className)} onClick={onClick}>
      {beforeContent}
      <div className={cn("flex flex-col gap-y-6 px-4 py-6 md:gap-y-8 md:px-6 md:py-10", contentClassName)}>
        <header
          className={cn(
            "flex w-full flex-col gap-4 pb-2 sm:flex-row sm:items-center sm:justify-between",
            headerClassName,
          )}
        >
          <h1 className={cn("text-4xl font-serif font-semibold leading-none md:text-5xl", titleClassName)}>{title}</h1>
          {actions ? <div className="flex flex-wrap items-center gap-3 md:gap-4">{actions}</div> : null}
        </header>
        {children}
      </div>
    </main>
  );
}
