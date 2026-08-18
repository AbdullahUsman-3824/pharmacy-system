"use client";

import { SearchBar } from "@/components/ui/searchBar";
import FilterChip from "@/components/ui/filterChip";

export interface InventoryFilterState {
  search: string;
  lowStockOnly: boolean;
  nearExpiryOnly: boolean;
  outOfStockOnly: boolean;
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
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="w-full sm:max-w-md">
        <SearchBar
          value={value.search}
          onChange={(search) => onChange({ ...value, search })}
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
          active={value.outOfStockOnly}
          tone="danger"
          onClick={() =>
            onChange({ ...value, outOfStockOnly: !value.outOfStockOnly })
          }
        >
          Out of Stock
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
