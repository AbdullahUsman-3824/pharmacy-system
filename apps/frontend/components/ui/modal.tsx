"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
};

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  size = "md",
}: ModalProps) {
  useEffect(() => {
    if (!open) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity duration-200"
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "modal-title" : undefined}
        className={`relative w-full ${sizeClasses[size]} max-h-[90vh] overflow-y-auto rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] shadow-[var(--shadow-lg)] transition-all duration-200`}
      >
        {(title || description) && (
          <div className="flex items-start justify-between gap-4 border-b border-[var(--color-border-light)] px-6 py-4">
            <div>
              {title && (
                <h2
                  id="modal-title"
                  className="text-base font-semibold text-[var(--color-text)]"
                >
                  {title}
                </h2>
              )}
              {description && (
                <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                  {description}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="shrink-0 rounded-[var(--radius-sm)] p-1 text-[var(--color-text-placeholder)] transition-colors duration-200 hover:bg-[var(--color-background-muted)] hover:text-[var(--color-text)]"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
        )}

        <div className="p-6">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
