import { CreateSaleInput, SaleType } from "@repo/shared";
import { SaleFormOutput } from "@/schemas/sale-form";

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function buildCreateSalePayload(form: SaleFormOutput): CreateSaleInput {
  return {
    type: form.type,
    customerId: form.customerId || undefined,
    saleDate: new Date(form.saleDate).toISOString(),
    originalSaleId:
      form.type === SaleType.SALE_RETURN ? form.originalSaleId : undefined,
    remarks: form.remarks,
    discountPercent: form.discountPercent || undefined,
    taxPercent: form.taxPercent || undefined,
    payments: form.payments,
    items: form.items.map((item) => {
      const packingSize = item.packingSize || 1;
      const unitQuantity = item.packQuantity * packingSize + item.looseQuantity;
      const grossAmount = round2(unitQuantity * item.saleRate);

      return {
        productId: item.productId,
        batchId: item.batchId,
        packQuantity: item.packQuantity,
        looseQuantity: item.looseQuantity,
        saleRate: item.saleRate,
        grossAmount,
        netAmount: grossAmount,
      };
    }),
  };
}
