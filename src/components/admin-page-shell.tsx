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
      <div className={cn("flex flex-col gap-y-8 px-6 py-10", contentClassName)}>
        <header className={cn("flex w-full items-center justify-between pb-2", headerClassName)}>
          <h1 className={cn("text-5xl font-serif font-semibold leading-none", titleClassName)}>{title}</h1>
          {actions ? <div className="flex items-center gap-4">{actions}</div> : null}
        </header>
        {children}
      </div>
    </main>
  );
}
