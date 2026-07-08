interface StatusBadgeProps {
  label: string;
}

export function StatusBadge({ label }: StatusBadgeProps) {
  return (
    <div className="flex items-center gap-2 text-sm text-ink-700">
      <span className="h-2 w-2 rounded-full bg-success" />
      {label}
    </div>
  );
}
