"use client";

import { useEffect, useRef, useState } from "react";
import { SearchBar } from "@/components/ui/searchBar";
import { useDebounce } from "@/hooks/useDebounce";
import FilterChip from "@/components/ui/filterChip";

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
  resultCount?: number;
}

export function InventoryFilters({
  value,
  onChange,
  resultCount,
}: InventoryFiltersProps) {
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
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="w-full sm:max-w-md">
        <SearchBar
          value={searchInput}
          onChange={setSearchInput}
          placeholder="Search by name, code, or barcode..."
          entityLabelPlural="products"
          count={resultCount}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <FilterChip
          active={value.lowStockOnly}
          tone="warning"
          onClick={() =>
            onChange({ ...value, lowStockOnly: !value.lowStockOnly })
          }
        >
          Low Stock
        </FilterChip>

        <FilterChip
          active={value.nearExpiryOnly}
          tone="danger"
          onClick={() =>
            onChange({ ...value, nearExpiryOnly: !value.nearExpiryOnly })
          }
        >
          Near Expiry
        </FilterChip>
      </div>
    </div>
  );
}
