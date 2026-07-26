interface StatusBadgeProps {
  label: string;
}

export function StatusBadge({ label }: StatusBadgeProps) {
  return (
    <div className="flex items-center gap-2 text-xs text-ink-700">
      <span className="h-1.5 w-1.5 rounded-full bg-success" />
      {label}
    </div>
  );
}
