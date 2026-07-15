import { StockVoucherType, StockVoucherOutput } from '@repo/shared';

const VOUCHER_PREFIX: Record<StockVoucherType, string> = {
  [StockVoucherType.OPENING]: 'OP',
  [StockVoucherType.PURCHASE]: 'PUR',
  [StockVoucherType.PURCHASE_RETURN]: 'PR',
  [StockVoucherType.STOCK_ADJUSTMENT]: 'ADJ',
  [StockVoucherType.STOCK_TRANSFER]: 'TRF',
};

export function previewVoucherNumber(
  type: StockVoucherType,
  vouchers: StockVoucherOutput[] | undefined,
): string {
  const prefix = VOUCHER_PREFIX[type];
  const countForType = (vouchers ?? []).filter((v) => v.type === type).length;
  const next = countForType + 1;
  return `${prefix}-${String(next).padStart(6, '0')}`;
}