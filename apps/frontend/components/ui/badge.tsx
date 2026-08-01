import { HTMLAttributes, forwardRef } from "react";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "danger" | "info";
  size?: "sm" | "md";
  rounded?: boolean;
}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      variant = "default",
      size = "md",
      rounded = false,
      className = "",
      children,
      ...props
    },
    ref,
  ) => {
    const baseStyles =
      "inline-flex items-center font-medium transition-all duration-200";

    const variants = {
      default:
        "bg-[var(--color-background-muted)] text-[var(--color-text-secondary)] border border-[var(--color-border)]",
      success:
        "bg-[var(--color-success-soft)] text-[var(--color-success-text)] border border-[var(--color-success-border)]",
      warning:
        "bg-[var(--color-warning-soft)] text-[var(--color-warning-text)] border border-[var(--color-warning-border)]",
      danger:
        "bg-[var(--color-danger-soft)] text-[var(--color-danger-text)] border border-[var(--color-danger-border)]",
      info: "bg-[var(--color-info-soft)] text-[var(--color-info-text)] border border-[var(--color-info-border)]",
    };

    const sizes = {
      sm: "px-2 py-0.5 text-xs",
      md: "px-3 py-1 text-sm",
    };

    const roundedClass = rounded
      ? "rounded-full"
      : "rounded-[var(--radius-sm)]";

    return (
      <span
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${roundedClass} ${className}`}
        {...props}
      >
        {children}
      </span>
    );
  },
);

Badge.displayName = "Badge";

export default Badge;
