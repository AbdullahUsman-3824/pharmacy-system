"use client";

import { Trash2, Eye, Printer } from "lucide-react";

export function VoucherActionsRow() {
  return (
    <div className="flex items-center gap-3 shrink-0">
      <button
        type="button"
        disabled
        title="Coming soon"
        className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 text-gray-400 font-medium rounded-lg cursor-not-allowed"
      >
        <Trash2 className="w-4 h-4" />
        Delete
      </button>
      <button
        type="button"
        disabled
        title="Coming soon"
        className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 text-gray-400 font-medium rounded-lg cursor-not-allowed"
      >
        <Eye className="w-4 h-4" />
        Preview
      </button>
      <button
        type="button"
        disabled
        title="Coming soon"
        className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 text-gray-400 font-medium rounded-lg cursor-not-allowed"
      >
        <Printer className="w-4 h-4" />
        Print
      </button>
    </div>
  );
}
