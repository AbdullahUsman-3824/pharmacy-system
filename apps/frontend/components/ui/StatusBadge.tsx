interface StatusBadgeProps {
  label: string;
  variant?: "online" | "offline" | "pending" | "active" | "inactive";
}

export function StatusBadge({ label, variant = "online" }: StatusBadgeProps) {
  const variants = {
    online:
      "bg-[var(--color-success-soft)] text-[var(--color-success-text)] border-[var(--color-success-border)]",
    offline:
      "bg-[var(--color-danger-soft)] text-[var(--color-danger-text)] border-[var(--color-danger-border)]",
    pending:
      "bg-[var(--color-warning-soft)] text-[var(--color-warning-text)] border-[var(--color-warning-border)]",
    active:
      "bg-[var(--color-info-soft)] text-[var(--color-info-text)] border-[var(--color-info-border)]",
    inactive:
      "bg-[var(--color-background-muted)] text-[var(--color-text-muted)] border-[var(--color-border)]",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-[var(--radius-full)] border ${variants[variant]}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5" />
      {label}
    </span>
  );
}
