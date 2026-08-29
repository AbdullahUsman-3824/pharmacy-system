function round2(n: number) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export interface ItemAmountInputs {
  /** Number of full packs */
  packQuantity: number;
  /** Loose units (not full packs) */
  looseQuantity: number;
  /** Purchase rate per pack */
  purchaseRate: number;
  /** Units per pack — used to convert loose qty to pack-rate equivalent */
  packingSize: number;
  discountPercent: number;
  taxPercent: number;
}

/**
 * Amounts are calculated on pack basis:
 *   pack part  = packQuantity * purchaseRate
 *   loose part = looseQuantity * (purchaseRate / packingSize)
 * Free quantity is units and has no rate / amount impact.
 */
export function calculateItemAmounts(input: ItemAmountInputs) {
  const packQuantity = input.packQuantity || 0;
  const looseQuantity = input.looseQuantity || 0;
  const purchaseRate = input.purchaseRate || 0;
  const packingSize = input.packingSize || 1;
  const discountPercent = input.discountPercent || 0;
  const taxPercent = input.taxPercent || 0;

  const unitRate = packingSize > 0 ? purchaseRate / packingSize : 0;
  const grossAmount = round2(
    packQuantity * purchaseRate + looseQuantity * unitRate,
  );
  const discountAmount = round2(grossAmount * (discountPercent / 100));
  const afterDiscount = grossAmount - discountAmount;
  const taxAmount = round2(afterDiscount * (taxPercent / 100));
  const netAmount = round2(afterDiscount + taxAmount);

  return { grossAmount, discountAmount, taxAmount, netAmount };
}
