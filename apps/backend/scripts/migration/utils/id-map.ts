export const companyMap = new Map<string | number, string>();
export const typeMap = new Map<string | number, string>();
export const groupMap = new Map<string | number, string>();
export const genericMap = new Map<string | number, string>();
export const distributorMap = new Map<string | number, string>();
export const productMap = new Map<string | number, string>();

export const accountMap = new Map<string | number, string>();
export const accountTypeMap = new Map<
  string | number,
  'BUSINESS_CONTACT' | 'PAYMENT_ACCOUNT'
>();

export const userMap = new Map<string | number, string>();

export const purchaseVoucherMap = new Map<string, string>();
export const batchMap = new Map<string, string>();

export const productExpiryBatchMap = new Map<string, string>();

export function getBatchMapKey(
  productKey: string,
  batchNumber: string,
  expiryDate: Date | null,
) {
  return [productKey, batchNumber, expiryDate?.toISOString() ?? ''].join('|');
}

export function getProductExpiryKey(
  productKey: string,
  expiryDate: Date | null,
) {
  return [productKey, expiryDate?.toISOString() ?? ''].join('|');
}
