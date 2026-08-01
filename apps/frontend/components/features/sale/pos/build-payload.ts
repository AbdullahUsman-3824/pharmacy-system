import { CreateSaleInput, SaleType } from "@repo/shared";
import { SaleFormOutput } from "@/schemas/sale-form";

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function buildCreateSalePayload(form: SaleFormOutput): CreateSaleInput {
  return {
    type: form.type,
    customerName: form.customerName || "Walk-in Customer",
    saleDate: new Date(form.saleDate).toISOString(),
    originalSaleId:
      form.type === SaleType.SALE_RETURN ? form.originalSaleId : undefined,
    remarks: form.remarks,
    discountPercent: form.discountPercent || undefined,
    taxPercent: form.taxPercent || undefined,
    items: form.items.map((item) => {
      const grossAmount = round2(
        item.packQuantity * item.saleRate + item.looseQuantity * item.looseRate,
      );
      return {
        productId: item.productId,
        batchId: item.batchId,
        packQuantity: item.packQuantity,
        saleRate: item.saleRate,
        looseQuantity: item.looseQuantity,
        looseRate: item.looseRate,
        grossAmount,
        netAmount: grossAmount,
      };
    }),
  };
}
