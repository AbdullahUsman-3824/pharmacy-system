import { CreateSaleInput, SaleType } from "@repo/shared";
import { calculateSaleItemAmounts } from "@/lib/sale-calculations";
import { SaleFormOutput } from "@/schemas/sale-form";

export function buildCreateSalePayload(form: SaleFormOutput): CreateSaleInput {
  return {
    type: form.type,
    customerName: form.customerName || "Walk-in Customer",
    saleDate: new Date(form.saleDate).toISOString(),
    originalSaleId:
      form.type === SaleType.SALE_RETURN ? form.originalSaleId : undefined,
    remarks: form.remarks,
    items: form.items.map((item) => {
      const amounts = calculateSaleItemAmounts(item);
      return {
        productId: item.productId,
        batchId: item.batchId,
        quantity: item.quantity,
        saleRate: item.saleRate,
        discountPercent: item.discountPercent,
        taxPercent: item.taxPercent,
        ...amounts,
      };
    }),
  };
}
