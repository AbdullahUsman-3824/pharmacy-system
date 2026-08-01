import { StatusBadge } from "@/components/ui/statusBadge";

interface TopbarProps {
  pharmacyName?: string;
}

export function Topbar({ pharmacyName = "Furqan Medicos" }: TopbarProps) {
  const timestamp = new Date().toLocaleString("en-IN", {
    timeStyle: "short",
  });

  return (
    <header className="flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-header)] px-6 py-2 h-[var(--header-height)]">
      <h1 className="text-sm font-semibold text-[var(--color-text)]">
        {pharmacyName}
      </h1>
      <div className="flex items-center gap-5">
        <StatusBadge label="Online" />
        <span className="text-xs text-[var(--color-text-muted)]">
          {timestamp}
        </span>
      </div>
    </header>
  );
}
