import { CreateStockVoucherInput } from "@repo/shared";
import { calculateItemAmounts } from "@/lib/stock-calculations";
import { StockVoucherFormOutput } from "@/schemas/stock-voucher";

export function buildCreateVoucherPayload(
  form: StockVoucherFormOutput,
  confirmedBatchKeys: Set<string> = new Set(),
  creatorPin: string,
): CreateStockVoucherInput {
  return {
    type: form.type,
    supplierId: form.supplierId || null,
    voucherDate: new Date(form.voucherDate).toISOString(),
    remarks: form.remarks,
    payments: form.payments,
    creatorPin,
    items: form.items.map((item) => {
      const amounts = calculateItemAmounts({
        packQuantity: item.packQuantity,
        looseQuantity: item.looseQuantity,
        purchaseRate: item.purchaseRate,
        packingSize: item.packingSize,
        discountPercent: item.discountPercent,
        taxPercent: item.taxPercent,
      });
      const batchKey = `${item.productId}::${item.batchNumber}`;
      return {
        productId: item.productId,
        batchNumber: item.batchNumber,
        expiryDate: item.expiryDate
          ? new Date(item.expiryDate).toISOString()
          : null,
        packQuantity: item.packQuantity,
        looseQuantity: item.looseQuantity,
        freeQuantity: item.freeQuantity,
        // Rates are per pack (as entered); backend stores them as-is
        purchaseRate: item.purchaseRate,
        saleRate: item.saleRate,
        discountPercent: item.discountPercent,
        taxPercent: item.taxPercent,
        confirmRateUpdate: confirmedBatchKeys.has(batchKey),
        ...amounts,
      };
    }),
  };
}
