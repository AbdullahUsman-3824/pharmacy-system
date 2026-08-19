import { HTMLAttributes, forwardRef } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "hover" | "bordered";
  padding?: "none" | "sm" | "md" | "lg";
  rounded?: boolean | null;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      variant = "default",
      padding = "md",
      className = "",
      rounded = true,
      ...props
    },
    ref,
  ) => {
    const baseStyles = "bg-[var(--color-card)]";
    const roundClass =
      rounded !== false && rounded !== null ? "rounded-[var(--radius-md)]" : "";

    const variants = {
      default:
        "shadow-[var(--shadow-sm)] border border-[var(--color-border-light)]",
      hover:
        "shadow-[var(--shadow-sm)] border border-[var(--color-border-light)] hover:shadow-[var(--shadow-md)] hover:bg-[var(--color-card-hover)] transition-all duration-200",
      bordered: "border border-[var(--color-border)]",
    };

    const paddings = {
      none: "",
      sm: "p-4",
      md: "p-[var(--card-padding)]",
      lg: "p-8",
    };

    return (
      <div
        ref={ref}
        className={`${baseStyles} ${roundClass} ${variants[variant]} ${paddings[padding]} ${className}`}
        {...props}
      />
    );
  },
);

Card.displayName = "Card";

export default Card;
