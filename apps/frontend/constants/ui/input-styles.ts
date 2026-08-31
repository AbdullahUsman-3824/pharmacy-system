export const inputBaseClass =
  "w-full bg-[var(--color-input)] border rounded-[var(--radius-sm)] px-2 py-1.5 text-sm text-[var(--color-text)] transition-all duration-200 focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-soft)]";

export function inputBorderClass(hasError?: boolean) {
  return hasError
    ? "border-[var(--color-danger)]"
    : "border-[var(--color-border)]";
}

export const fieldErrorClass =
  "text-xs text-[var(--color-danger)] mt-0.5 leading-none";

export const datePickerClass =
  "w-full bg-[var(--color-input)] border rounded-[var(--radius-sm)] px-2 py-1.5 text-sm text-[var(--color-text)] transition-all duration-200 cursor-pointer focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-soft)]";

export const amountTextClass = "text-[var(--color-text-secondary)]";
export const amountHighlightClass = "text-[var(--color-primary)]";
