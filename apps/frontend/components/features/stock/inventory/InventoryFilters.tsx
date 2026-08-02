"use client";

import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
// import { Combobox } from "@/components/ui/combobox";
// import { useLookups } from "@/hooks/use-lookups";

export interface InventoryFilterState {
  search: string;
  lowStockOnly: boolean;
  nearExpiryOnly: boolean;
  groupId?: string;
  typeId?: string;
}

interface InventoryFiltersProps {
  value: InventoryFilterState;
  onChange: (next: InventoryFilterState) => void;
}

export function InventoryFilters({ value, onChange }: InventoryFiltersProps) {
  const [searchInput, setSearchInput] = useState(value.search);
  const debouncedSearch = useDebounce(searchInput, 350);

  const valueRef = useRef(value);
  const onChangeRef = useRef(onChange);

  // Sync refs AFTER render, not during — Compiler-safe
  useEffect(() => {
    valueRef.current = value;
    onChangeRef.current = onChange;
  });

  useEffect(() => {
    if (debouncedSearch !== valueRef.current.search) {
      onChangeRef.current({ ...valueRef.current, search: debouncedSearch });
    }
  }, [debouncedSearch]);

  return (
    <div className="flex flex-wrap items-center gap-3 mb-4">
      <div className="relative flex-1 min-w-[220px]">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search by name, code, or barcode..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="w-full pl-8 pr-3 py-2 text-sm border rounded-md"
        />
      </div>

      <button
        type="button"
        onClick={() =>
          onChange({ ...value, lowStockOnly: !value.lowStockOnly })
        }
        className={`px-3 py-2 text-sm rounded-md border ${
          value.lowStockOnly
            ? "bg-warn-bg border-warn-border text-warn-strong"
            : "border-border"
        }`}
      >
        Low Stock
      </button>

      <button
        type="button"
        onClick={() =>
          onChange({ ...value, nearExpiryOnly: !value.nearExpiryOnly })
        }
        className={`px-3 py-2 text-sm rounded-md border ${
          value.nearExpiryOnly
            ? "bg-danger-bg border-danger-border text-danger-strong"
            : "border-border"
        }`}
      >
        Near Expiry
      </button>

      {/* Group / Type filters — wire to your existing lookups source */}
      {/* <Combobox options={groupOptions} value={value.groupId} onChange={(groupId) => onChange({ ...value, groupId })} placeholder="Group" /> */}
      {/* <Combobox options={typeOptions} value={value.typeId} onChange={(typeId) => onChange({ ...value, typeId })} placeholder="Type" /> */}
    </div>
  );
}
