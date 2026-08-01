import { HTMLAttributes, forwardRef } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "hover" | "bordered";
  padding?: "none" | "sm" | "md" | "lg";
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ variant = "default", padding = "md", className = "", ...props }, ref) => {
    const baseStyles = "bg-[var(--color-card)] rounded-[var(--radius-md)]";

    const variants = {
      default: "shadow-[var(--shadow-sm)] border border-[var(--color-border-light)]",
      hover: "shadow-[var(--shadow-sm)] border border-[var(--color-border-light)] hover:shadow-[var(--shadow-md)] hover:bg-[var(--color-card-hover)] transition-all duration-200",
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
        className={`${baseStyles} ${variants[variant]} ${paddings[padding]} ${className}`}
        {...props}
      />
    );
  }
);

Card.displayName = "Card";

export default Card;