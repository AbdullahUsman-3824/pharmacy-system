export const companyMap = new Map<string | number, string>();
export const typeMap = new Map<string | number, string>();
export const groupMap = new Map<string | number, string>();
export const genericMap = new Map<string | number, string>();
export const supplierMap = new Map<string | number, string>();
export const productMap = new Map<string | number, string>();
export const purchaseVoucherMap = new Map<string, string>();
export const batchMap = new Map<string, string>();
export function getBatchMapKey(
  productKey: string,
  batchNumber: string,
  expiryDate: Date | null,
) {
  return [productKey, batchNumber, expiryDate?.toISOString() ?? ''].join('|');
}
