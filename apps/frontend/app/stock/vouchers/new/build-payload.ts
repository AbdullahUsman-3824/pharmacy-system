import { CreateStockVoucherInput } from "@repo/shared";
import { calculateItemAmounts } from "../../../../lib/stock-calculations";
import { StockVoucherFormOutput } from "@/schemas/stockVoucher";

export function buildCreateVoucherPayload(
  form: StockVoucherFormOutput,
  confirmedBatchKeys: Set<string> = new Set(),
): CreateStockVoucherInput {
  return {
    type: form.type,
    supplierId: form.supplierId || null,
    voucherDate: new Date(form.voucherDate).toISOString(),
    remarks: form.remarks,
    items: form.items.map((item) => {
      const amounts = calculateItemAmounts(item);
      const batchKey = `${item.productId}::${item.batchNumber}`;
      return {
        productId: item.productId,
        batchNumber: item.batchNumber,
        expiryDate: item.expiryDate
          ? new Date(item.expiryDate).toISOString()
          : null,
        quantity: item.quantity,
        freeQuantity: item.freeQuantity,
        purchaseRate: item.purchaseRate,
        saleRate: item.saleRate,
        discountPercent: item.discountPercent,
        taxPercent: item.taxPercent,
        confirmRateUpdate: confirmedBatchKeys.has(batchKey), // NEW
        ...amounts,
      };
    }),
  };
}
