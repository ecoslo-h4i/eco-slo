import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "muted" | "success" | "warning" | "danger" | "info";
type IconSide = "left" | "right";
type BadgeSize = "sm" | "md";
type BadgeShape = "pill" | "rounded";
type BadgeTextCase = "none" | "capitalize";

const badgeVariantClasses: Record<BadgeVariant, string> = {
  default: "border-primary-border bg-primary-soft text-primary-active",
  muted: "border-border bg-off-white-2 text-text-muted",
  success: "border-success-border bg-success-bg text-success",
  warning: "border-border-strong bg-off-white-2 text-text-muted",
  danger: "border-danger-border bg-danger-bg text-danger",
  info: "border-info-border bg-info-bg text-info",
};

const badgeSizeClasses: Record<BadgeSize, string> = {
  sm: "h-6 min-h-0 px-2 py-0 text-[10px]",
  md: "min-h-8 px-3 py-1.5 text-sm",
};

const badgeShapeClasses: Record<BadgeShape, string> = {
  pill: "rounded-full",
  rounded: "rounded-lg",
};

const badgeTextCaseClasses: Record<BadgeTextCase, string> = {
  none: "",
  capitalize: "capitalize",
};

export default function Badge({
  icon,
  iconSide = "left",
  shape = "pill",
  shrink = false,
  textCase = "none",
  variant = "default",
  size = "md",
  children,
}: {
  icon?: React.ReactNode;
  iconSide?: IconSide;
  shape?: BadgeShape;
  shrink?: boolean;
  textCase?: BadgeTextCase;
  variant?: BadgeVariant;
  size?: BadgeSize;
  children?: React.ReactNode;
}) {
  const iconOnLeft = icon && iconSide === "left";
  const iconOnRight = icon && iconSide === "right";

  return (
    <div
      className={cn(
        "inline-flex w-fit max-w-full items-center justify-center gap-1.5 border font-mulish font-semibold leading-none",
        badgeVariantClasses[variant],
        badgeSizeClasses[size],
        badgeShapeClasses[shape],
        badgeTextCaseClasses[textCase],
        shrink && "shrink-0",
      )}
    >
      {iconOnLeft ? icon : null}
      {children}
      {iconOnRight ? icon : null}
    </div>
  );
}
