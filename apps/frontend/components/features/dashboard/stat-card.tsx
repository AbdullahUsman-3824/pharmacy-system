import type { StatCardData } from "@/lib/types";

const toneClasses: Record<StatCardData["tone"], string> = {
  neutral:
    "bg-[var(--color-card)] border-[var(--color-border)] text-[var(--color-text)]",
  warn: "bg-[var(--color-warning-soft)] border-[var(--color-warning-border)] text-[var(--color-warning-text)]",
  danger:
    "bg-[var(--color-danger-soft)] border-[var(--color-danger-border)] text-[var(--color-danger-text)]",
};

const labelToneClasses: Record<StatCardData["tone"], string> = {
  neutral: "text-[var(--color-text-muted)]",
  warn: "text-[var(--color-warning-text)]",
  danger: "text-[var(--color-danger-text)]",
};

export function StatCard({ label, value, tone }: StatCardData) {
  return (
    <div
      className={`rounded-[var(--radius-md)] border px-5 py-4 shadow-[var(--shadow-sm)] ${toneClasses[tone]}`}
    >
      <p className={`text-sm ${labelToneClasses[tone]}`}>{label}</p>
      <p className="mt-1.5 text-2xl font-semibold">{value}</p>
    </div>
  );
}
