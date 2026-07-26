import { StatusBadge } from "@/components/ui/StatusBadge";

interface TopbarProps {
  pharmacyName: string;
}

export function Topbar({ pharmacyName }: TopbarProps) {
  const timestamp = new Date().toLocaleString("en-IN", {
    timeStyle: "short",
  });

  return (
    <header className="flex items-center justify-between border-b border-border bg-surface-card px-6 py-2">
      <h1 className="text-sm font-semibold text-ink-900">{pharmacyName}</h1>
      <div className="flex items-center gap-5">
        <StatusBadge label="Online" />
        <span className="text-xs text-ink-500">{timestamp}</span>
      </div>
    </header>
  );
}
