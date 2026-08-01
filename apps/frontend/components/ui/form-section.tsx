import { HTMLAttributes } from "react";
import Card from "./card";
import { cn } from "@/lib/cn";

interface FormSectionProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
}

export function FormSection({
  title,
  description,
  className = "",
  children,
  ...props
}: FormSectionProps) {
  return (
    <Card padding="lg" className={cn("space-y-5", className)} {...props}>
      <div className="space-y-1">
        <h3 className="text-sm font-semibold tracking-[0.12em] text-[var(--color-text)] uppercase">
          {title}
        </h3>
        {description ? (
          <p className="text-sm leading-6 text-[var(--color-text-secondary)]">
            {description}
          </p>
        ) : null}
      </div>

      {children}
    </Card>
  );
}
