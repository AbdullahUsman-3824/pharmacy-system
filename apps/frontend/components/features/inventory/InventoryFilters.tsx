"use client";

import { SearchBar } from "@/components/ui/searchBar";
import FilterChip from "@/components/ui/filterChip";
import { InventoryStatus } from "@repo/shared";

export interface InventoryFilterState {
  search: string;
  status?: InventoryStatus[];
}

interface InventoryFiltersProps {
  value: InventoryFilterState;
  onChange: (next: InventoryFilterState) => void;
  resultCount?: number;
}

const STATUS_CHIPS: {
  label: string;
  value: InventoryStatus;
  tone: "warning" | "danger";
}[] = [
  { label: "Low Stock", value: InventoryStatus.LOW_STOCK, tone: "warning" },
  {
    label: "Out of Stock",
    value: InventoryStatus.OUT_OF_STOCK,
    tone: "danger",
  },
  {
    label: "Near Expiry",
    value: InventoryStatus.NEAR_EXPIRY,
    tone: "danger",
  },
];

export function InventoryFilters({
  value,
  onChange,
  resultCount,
}: InventoryFiltersProps) {
  function toggleStatus(status: InventoryStatus) {
    const current = value.status ?? [];
    const next = current.includes(status)
      ? current.filter((s) => s !== status)
      : [...current, status];

    onChange({
      ...value,
      status: next.length > 0 ? next : undefined,
    });
  }

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
        {STATUS_CHIPS.map((chip) => (
          <FilterChip
            key={chip.value}
            active={(value.status ?? []).includes(chip.value)}
            tone={chip.tone}
            onClick={() => toggleStatus(chip.value)}
          >
            {chip.label}
          </FilterChip>
        ))}
      </div>
    </div>
  );
}
