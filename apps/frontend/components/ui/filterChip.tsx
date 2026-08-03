import { cn } from "@/lib/cn";

export default function FilterChip({
  active,
  tone,
  onClick,
  children,
}: {
  active: boolean;
  tone: "warning" | "danger";
  onClick: () => void;
  children: React.ReactNode;
}) {
  const activeClasses =
    tone === "warning"
      ? "border-[var(--color-warning)] bg-[var(--color-warning)] text-white"
      : "border-[var(--color-danger)] bg-[var(--color-danger)] text-white";

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors cursor-pointer",
        active
          ? activeClasses
          : "border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-text-secondary)] hover:text-[var(--color-text)]",
      )}
    >
      {children}
    </button>
  );
}
