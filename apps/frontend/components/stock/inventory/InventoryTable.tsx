"use client";

import { Fragment, useState } from "react";
import { ChevronDown, ChevronRight, ArrowUpDown } from "lucide-react";
import {
  INVENTORY_COLUMNS,
  BATCH_COLUMNS,
} from "@/constants/stock/inventory-table-columns";
import type { InventoryProductDto } from "@repo/shared";

interface InventoryTableProps {
  items: InventoryProductDto[];
  sortBy: string;
  sortDir: "asc" | "desc";
  onSortChange: (sortBy: string) => void;
}

function formatDate(iso: string | null): string {
  return iso ? new Date(iso).toLocaleDateString() : "—";
}

export function InventoryTable({
  items,
  sortBy,
  onSortChange,
}: InventoryTableProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggleExpand = (productId: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
  };

  return (
    <table className="w-full table-fixed border-collapse">
      <colgroup>
        {INVENTORY_COLUMNS.map((col) => (
          <col key={col.key} style={{ width: col.width }} />
        ))}
      </colgroup>
      <thead>
        <tr className="border-b text-left text-sm text-muted-foreground">
          {INVENTORY_COLUMNS.map((col) => (
            <th key={col.key} className="py-2 px-2">
              {col.sortable ? (
                <button
                  className="flex items-center gap-1 hover:text-foreground"
                  onClick={() => onSortChange(col.key)}
                >
                  {col.label}
                  <ArrowUpDown
                    className={`h-3 w-3 ${sortBy === col.key ? "opacity-100" : "opacity-30"}`}
                  />
                </button>
              ) : (
                col.label
              )}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {items.map((product) => {
          const isExpanded = expanded.has(product.productId);
          return (
            <Fragment key={product.productId}>
              <tr
                key={product.productId}
                className="border-b text-sm hover:bg-muted/40 cursor-pointer"
                onClick={() => toggleExpand(product.productId)}
              >
                <td className="py-2 px-2">
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </td>
                <td className="py-2 px-2 font-medium">{product.name}</td>
                <td className="py-2 px-2 text-muted-foreground">
                  {product.code}
                  {product.barcode ? ` / ${product.barcode}` : ""}
                </td>
                <td className="py-2 px-2">{product.shelfNo ?? "—"}</td>
                <td className="py-2 px-2">{product.totalQuantity}</td>
                <td className="py-2 px-2">
                  {product.retailRate !== null
                    ? `Rs ${product.retailRate.toLocaleString()}`
                    : "—"}
                </td>
                <td className="py-2 px-2">
                  {formatDate(product.nearestExpiryDate)}
                </td>
                <td className="py-2 px-2">
                  {product.isLowStock && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-warn-bg text-warn-strong mr-1">
                      Low
                    </span>
                  )}
                  {product.hasNearExpiryBatch && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-danger-bg text-danger-strong">
                      Expiring
                    </span>
                  )}
                </td>
              </tr>

              {isExpanded && (
                <tr key={`${product.productId}-batches`}>
                  <td
                    colSpan={INVENTORY_COLUMNS.length}
                    className="bg-muted/20 px-8 py-2"
                  >
                    <table className="w-full table-fixed">
                      <colgroup>
                        {BATCH_COLUMNS.map((col) => (
                          <col key={col.key} style={{ width: col.width }} />
                        ))}
                      </colgroup>
                      <thead>
                        <tr className="text-xs text-muted-foreground">
                          {BATCH_COLUMNS.map((col) => (
                            <th key={col.key} className="py-1 px-2 text-left">
                              {col.label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {product.batches.map((batch) => (
                          <tr key={batch.batchId} className="text-sm">
                            <td className="py-1 px-2">{batch.batchNumber}</td>
                            <td className="py-1 px-2">
                              {formatDate(batch.expiryDate)}
                            </td>
                            <td className="py-1 px-2">
                              {batch.currentQuantity}
                            </td>
                            <td className="py-1 px-2">
                              {batch.purchaseRate !== null
                                ? `Rs ${batch.purchaseRate}`
                                : "—"}
                            </td>
                            <td className="py-1 px-2">
                              {batch.saleRate !== null
                                ? `Rs ${batch.saleRate}`
                                : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </td>
                </tr>
              )}
            </Fragment>
          );
        })}
      </tbody>
    </table>
  );
}
