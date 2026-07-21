import { StatusBadge } from "@/components/ui/StatusBadge";
import { Avatar } from "@/components/ui/Avatar";

interface TopbarProps {
  pharmacyName: string;
}

export function Topbar({ pharmacyName }: TopbarProps) {
  const timestamp = new Date().toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <header className="flex items-center justify-between border-b border-border bg-surface-card px-6 py-4">
      <h1 className="text-[15px] font-semibold text-ink-900">{pharmacyName}</h1>

      <div className="flex items-center gap-5">
        <StatusBadge label="Master connected" />
        <span className="text-sm text-ink-500">{timestamp}</span>
        <Avatar initial="F" />
      </div>
    </header>
  );
}
