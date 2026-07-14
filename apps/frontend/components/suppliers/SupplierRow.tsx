"use client";

import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import type { SupplierDto } from "@repo/shared";

interface SupplierRowProps {
  supplier: SupplierDto;
  onDelete: (id: string) => void;
}

export function SupplierRow({ supplier, onDelete }: SupplierRowProps) {
  const router = useRouter();

  function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    if (confirm(`Delete supplier "${supplier.name}"?`)) {
      onDelete(supplier.id);
    }
  }

  return (
    <div
      onClick={() => router.push(`/suppliers/${supplier.id}/edit`)}
      className="group grid cursor-pointer grid-cols-[1fr_140px_140px_1fr_100px_80px] items-center gap-3 border-b border-border-soft px-4 py-3 text-sm hover:bg-surface-sunken"
    >
      <span className="font-medium text-ink-900">{supplier.name}</span>
      <span className="text-ink-700">{supplier.contactPerson ?? "—"}</span>
      <span className="text-ink-700">{supplier.phone ?? supplier.mobile ?? "—"}</span>
      <span className="truncate text-ink-700">{supplier.email ?? "—"}</span>
      <span className="text-ink-700">{supplier.city ?? "—"}</span>
      <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100">
        <button
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/suppliers/${supplier.id}/edit`);
          }}
          className="text-ink-400 hover:text-brand"
        >
          <Pencil size={16} />
        </button>
        <button onClick={handleDelete} className="text-ink-400 hover:text-danger-strong">
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}