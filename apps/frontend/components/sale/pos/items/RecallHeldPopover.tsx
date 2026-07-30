"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { HeldInvoice } from "@/lib/context/HeldInvoicesContext";

interface RecallHeldPopoverProps {
  heldInvoices: HeldInvoice[];
  onSelect: (id: string) => void;
  onClose: () => void;
}

function timeAgo(date: Date): string {
  const minutes = Math.round((Date.now() - date.getTime()) / 60000);
  if (minutes < 1) return "just now";
  if (minutes === 1) return "1 min ago";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  return hours === 1 ? "1 hr ago" : `${hours} hrs ago`;
}

export function RecallHeldPopover({
  heldInvoices,
  onSelect,
  onClose,
}: RecallHeldPopoverProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
      <div className="w-full max-w-sm rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <h3 className="text-sm font-semibold text-gray-700">
            Held invoices
            {heldInvoices.length > 0 && (
              <span className="ml-1.5 text-gray-400">
                ({heldInvoices.length})
              </span>
            )}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {heldInvoices.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-gray-400">
            Nothing held right now.
          </p>
        ) : (
          <div className="max-h-80 overflow-y-auto">
            {heldInvoices
              .slice()
              .reverse()
              .map((invoice) => (
                <button
                  key={invoice.id}
                  type="button"
                  onClick={() => onSelect(invoice.id)}
                  className="flex w-full items-center justify-between border-b border-gray-50 px-4 py-3 text-left hover:bg-blue-50/60 last:border-b-0"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {invoice.customerName}
                    </p>
                    <p className="text-xs text-gray-400">
                      {invoice.itemCount} item
                      {invoice.itemCount === 1 ? "" : "s"} ·{" "}
                      {timeAgo(invoice.heldAt)}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-blue-700">
                    PKR {invoice.netAmount.toFixed(2)}
                  </span>
                </button>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
