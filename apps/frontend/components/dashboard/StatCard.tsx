import type { StatCardData } from "@/lib/types";

const toneClasses: Record<StatCardData["tone"], string> = {
  neutral: "bg-surface-card border-border text-ink-900",
  warn: "bg-warn-bg border-warn-border text-warn-strong",
  danger: "bg-danger-bg border-danger-border text-danger-strong",
};

const labelToneClasses: Record<StatCardData["tone"], string> = {
  neutral: "text-ink-500",
  warn: "text-warn-text",
  danger: "text-danger-text",
};

export function StatCard({ label, value, tone }: StatCardData) {
  return (
    <div className={`rounded-xl border px-5 py-4 shadow-panel ${toneClasses[tone]}`}>
      <p className={`text-sm ${labelToneClasses[tone]}`}>{label}</p>
      <p className="mt-1.5 text-2xl font-semibold">{value}</p>
    </div>
  );
}
