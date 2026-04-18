type BadgeVariant = "default" | "muted" | "warning" | "destructive";
type IconSide = "left" | "right";

const badgeVariantClasses: Record<BadgeVariant, string> = {
  default: "text-primary bg-primary/15 border border-primary/20",
  muted: "text-text-muted bg-text-muted/15 border border-text-muted/20",
  warning: "text-warning bg-warning/15 border border-warning/20",
  destructive: "text-destructive bg-destructive/15 border border-destructive/20",
};

export default function Badge({
  className,
  icon,
  iconSide = "left",
  variant = "default",
  children,
}: {
  className?: string;
  icon?: React.ReactNode;
  iconSide?: IconSide;
  variant?: BadgeVariant;
  children?: React.ReactNode;
}) {
  const iconOnLeft = icon && iconSide === "left";
  const iconOnRight = icon && iconSide === "right";

  return (
    <div
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm font-semibold ${badgeVariantClasses[variant]} ${className || ""}`}
    >
      {iconOnLeft ? icon : null}
      {children}
      {iconOnRight ? icon : null}
    </div>
  );
}
