function round2(n: number) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export interface ItemAmountInputs {
  quantity: number;
  purchaseRate: number;
  discountPercent: number;
  taxPercent: number;
}

export function calculateItemAmounts(input: ItemAmountInputs) {
  const quantity = input.quantity || 0;
  const purchaseRate = input.purchaseRate || 0;
  const discountPercent = input.discountPercent || 0;
  const taxPercent = input.taxPercent || 0;

  const grossAmount = round2(quantity * purchaseRate);
  const discountAmount = round2(grossAmount * (discountPercent / 100));
  const afterDiscount = grossAmount - discountAmount;
  const taxAmount = round2(afterDiscount * (taxPercent / 100));
  const netAmount = round2(afterDiscount + taxAmount);

  return { grossAmount, discountAmount, taxAmount, netAmount };
}
