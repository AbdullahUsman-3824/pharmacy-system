import { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

interface ToolbarProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

function Toolbar({ children, className, ...props }: ToolbarProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] p-4 shadow-[var(--shadow-sm)]",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

interface ToolbarGroupProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

function ToolbarGroup({ children, className, ...props }: ToolbarGroupProps) {
  return (
    <div className={cn("flex items-center gap-3", className)} {...props}>
      {children}
    </div>
  );
}

function ToolbarSpacer() {
  return <div className="flex-1" />;
}

interface ToolbarCountProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode;
}

function ToolbarCount({ children, className, ...props }: ToolbarCountProps) {
  return (
    <span
      className={cn("text-sm text-[var(--color-text-muted)]", className)}
      {...props}
    >
      {children}
    </span>
  );
}

export { Toolbar, ToolbarGroup, ToolbarSpacer, ToolbarCount };
