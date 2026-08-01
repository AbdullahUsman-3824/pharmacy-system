import { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface PageHeaderProps {
  title: string;
  description?: string;
  children?: ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  children,
  className,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        "flex flex-col gap-4 border-b border-[var(--color-border)] pb-4 lg:flex-row lg:items-end lg:justify-between",
        className,
      )}
    >
      <div className="min-w-0">
        <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text)]">
          {title}
        </h1>

        {description && (
          <p className="mt-1 max-w-3xl text-sm leading-6 text-[var(--color-text-muted)]">
            {description}
          </p>
        )}
      </div>

      {children && (
        <div className="flex shrink-0 items-center gap-3">{children}</div>
      )}
    </header>
  );
}
