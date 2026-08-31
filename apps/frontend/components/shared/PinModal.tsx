// PinModal.tsx
import React, { useState, useRef, useEffect } from "react";
import { X } from "lucide-react";

interface PinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (pin: string) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
}

const PIN_MIN_LENGTH = 4;
const PIN_MAX_LENGTH = 6;

export const PinModal: React.FC<PinModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
}) => {
  const [pin, setPin] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const raf = requestAnimationFrame(() => {
      inputRef.current?.focus();
    });

    return () => cancelAnimationFrame(raf);
  }, [isOpen]);

  const canSubmit =
    pin.length >= PIN_MIN_LENGTH && pin.length <= PIN_MAX_LENGTH;

  const handleConfirm = () => {
    if (!canSubmit) return;

    onConfirm(pin);
    setPin("");
  };

  const handleClose = () => {
    setPin("");
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleConfirm();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
      onClick={handleClose}
      style={{ padding: "var(--page-padding)" }}
    >
      <div
        className="relative w-full max-w-md rounded-[var(--radius-lg)] shadow-[var(--shadow-lg)]"
        style={{
          backgroundColor: "var(--color-card)",
          border: "1px solid var(--color-border-light)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between border-b p-4"
          style={{ borderColor: "var(--color-border-light)" }}
        >
          <h2
            className="text-lg font-semibold"
            style={{ color: "var(--color-text)" }}
          >
            {title}
          </h2>
          <button
            onClick={handleClose}
            className="rounded-full p-1 transition-colors hover:bg-gray-100"
            aria-label="Close"
          >
            <X
              className="h-5 w-5"
              style={{ color: "var(--color-text-muted)" }}
            />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4">
          {description && (
            <p
              className="text-sm"
              style={{ color: "var(--color-text-secondary)" }}
            >
              {description}
            </p>
          )}

          <div>
            <label
              htmlFor="pin-input"
              className="block text-sm font-medium"
              style={{ color: "var(--color-text-secondary)" }}
            >
              PIN
            </label>
            <input
              id="pin-input"
              ref={inputRef}
              type="password"
              inputMode="text"
              autoComplete="off"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              onKeyDown={handleKeyDown}
              className="mt-1 block w-full rounded-[var(--radius-sm)] border px-3 py-2 text-sm transition-shadow focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
              style={{
                backgroundColor: "var(--color-input)",
                borderColor: "var(--color-border)",
                color: "var(--color-text)",
              }}
              placeholder="Enter PIN"
              maxLength={PIN_MAX_LENGTH}
            />
          </div>
        </div>

        {/* Footer */}
        <div
          className="flex justify-end gap-2 border-t p-4"
          style={{ borderColor: "var(--color-border-light)" }}
        >
          <button
            onClick={handleClose}
            className="rounded-[var(--radius-sm)] px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-100"
            style={{ color: "var(--color-text-secondary)" }}
          >
            {cancelLabel}
          </button>
          <button
            onClick={handleConfirm}
            disabled={!canSubmit}
            className="rounded-[var(--radius-sm)] px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50"
            style={{ backgroundColor: "var(--color-primary)" }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor =
                "var(--color-primary-hover)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "var(--color-primary)")
            }
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
