"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { SupplierSearchBar } from "./SupplierSearchBar";
import { SupplierRow } from "./SupplierRow";
import { useSuppliers, useDeleteSupplier } from "@/hooks/useSuppliers";

export function SuppliersTable() {
  const router = useRouter();
  const { data: suppliers = [], isLoading } = useSuppliers();
  const { mutate: deleteSupplier } = useDeleteSupplier();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return suppliers;
    return suppliers.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.contactPerson?.toLowerCase().includes(q) ||
        s.city?.toLowerCase().includes(q),
    );
  }, [suppliers, query]);

  return (
    <div className="flex flex-col gap-4">
      <SupplierSearchBar
        value={query}
        onChange={setQuery}
        count={suppliers.length}
        onAddClick={() => router.push("/suppliers/new")}
      />

      <div className="overflow-hidden rounded-xl border border-border bg-surface-card shadow-panel">
        <div className="grid grid-cols-[1fr_140px_140px_1fr_100px_80px] gap-3 border-b border-border px-4 py-2 text-sm text-ink-500">
          <span>Name</span>
          <span>Contact Person</span>
          <span>Phone</span>
          <span>Email</span>
          <span>City</span>
          <span />
        </div>

        {isLoading ? (
          <div className="px-4 py-8 text-center text-sm text-ink-400">
            Loading suppliers...
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-ink-400">
            No suppliers found
          </div>
        ) : (
          <div>
            {filtered.map((supplier) => (
              <SupplierRow
                key={supplier.id}
                supplier={supplier}
                onDelete={deleteSupplier}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
