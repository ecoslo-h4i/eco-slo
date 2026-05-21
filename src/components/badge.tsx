import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "muted" | "success" | "warning" | "danger" | "info";
type IconSide = "left" | "right";
type BadgeSize = "sm" | "md";

const badgeVariantClasses: Record<BadgeVariant, string> = {
  default: "border-primary-border bg-primary-soft text-primary-active",
  muted: "border-border bg-off-white-2 text-text-muted",
  success: "border-success-border bg-success-bg text-success",
  warning: "border-border-strong bg-off-white-2 text-text-muted",
  danger: "border-danger-border bg-danger-bg text-danger",
  info: "border-info-border bg-info-bg text-info",
};

const badgeSizeClasses: Record<BadgeSize, string> = {
  sm: "min-h-6 px-2.5 py-1.5 text-2xs",
  md: "min-h-8 px-3 py-1.5 text-sm",
};

export default function Badge({
  className,
  icon,
  iconSide = "left",
  variant = "default",
  size = "md",
  children,
}: {
  className?: string;
  icon?: React.ReactNode;
  iconSide?: IconSide;
  variant?: BadgeVariant;
  size?: BadgeSize;
  children?: React.ReactNode;
}) {
  const iconOnLeft = icon && iconSide === "left";
  const iconOnRight = icon && iconSide === "right";

  return (
    <div
      className={cn(
        "inline-flex w-fit max-w-full items-center justify-center gap-1.5 rounded-full border font-mulish font-semibold leading-none",
        badgeVariantClasses[variant],
        badgeSizeClasses[size],
        className,
      )}
    >
      {iconOnLeft ? icon : null}
      {children}
      {iconOnRight ? icon : null}
    </div>
  );
}
