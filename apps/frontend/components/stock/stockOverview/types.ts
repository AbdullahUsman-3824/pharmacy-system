import type {
  StockVoucherType,
  StockVoucherListItem,
  StockVoucherOutput,
} from "@repo/shared";

export type { StockVoucherType, StockVoucherListItem, StockVoucherOutput };

export interface StockStats {
  total: number;
  purchases: number;
  sales: number;
  totalValue: number;
}

export interface VoucherTypeConfig {
  color: string;
  label: string;
  icon: ElementType<React.SVGProps<SVGSVGElement>>;
}

// Voucher type configuration using the global enum
import {
  ShoppingCart,
  PackagePlus,
  PackageMinus,
  SlidersHorizontal,
  BetweenHorizontalStart,
} from "lucide-react";
import { ElementType } from "react";

export const VOUCHER_TYPES: Record<StockVoucherType, VoucherTypeConfig> = {
  OPENING: {
    color: "text-gray-700 bg-gray-50 border-gray-200",
    label: "Opening",
    icon: PackagePlus,
  },
  PURCHASE: {
    color: "text-emerald-700 bg-emerald-50 border-emerald-200",
    label: "Purchase",
    icon: ShoppingCart,
  },
  PURCHASE_RETURN: {
    color: "text-amber-700 bg-amber-50 border-amber-200",
    label: "Return",
    icon: PackageMinus,
  },
  STOCK_ADJUSTMENT: {
    color: "text-purple-700 bg-purple-50 border-purple-200",
    label: "Adjustment",
    icon: SlidersHorizontal,
  },
  STOCK_TRANSFER: {
    color: "text-blue-700 bg-blue-50 border-blue-200",
    label: "Transfer",
    icon: BetweenHorizontalStart,
  },
};
