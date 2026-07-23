import { SaleType, SaleDto } from "@repo/shared";

const SALE_PREFIX: Record<SaleType, string> = {
  [SaleType.SALE]: "S",
  [SaleType.SALE_RETURN]: "SR",
};

export function previewSaleNumber(
  type: SaleType,
  sales: SaleDto[] | undefined,
): string {
  const prefix = SALE_PREFIX[type];
  const countForType = (sales ?? []).filter((s) => s.type === type).length;
  const next = countForType + 1;
  return `${prefix}-${String(next).padStart(6, "0")}`;
}
