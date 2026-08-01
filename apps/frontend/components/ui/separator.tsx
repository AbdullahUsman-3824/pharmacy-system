import { HTMLAttributes, forwardRef } from "react";

interface SeparatorProps extends HTMLAttributes<HTMLHRElement> {
  orientation?: "horizontal" | "vertical";
  decorative?: boolean;
}

const Separator = forwardRef<HTMLHRElement, SeparatorProps>(
  (
    { orientation = "horizontal", decorative = true, className = "", ...props },
    ref,
  ) => {
    const baseStyles =
      "border-0 bg-[var(--color-border)] flex-shrink-0 transition-all duration-200";

    const orientationStyles = {
      horizontal: "w-full h-px",
      vertical: "h-full w-px",
    };

    return (
      <hr
        ref={ref}
        role={decorative ? "none" : "separator"}
        aria-orientation={orientation}
        className={`${baseStyles} ${orientationStyles[orientation]} ${className}`}
        {...props}
      />
    );
  },
);

Separator.displayName = "Separator";

export default Separator;
