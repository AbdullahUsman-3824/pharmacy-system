import { SaleType, CreateSaleInput } from "@repo/shared";
import { SaleReturnFormOutput } from "@/schemas/sale-return-form";

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function buildReturnPayload(
  data: SaleReturnFormOutput,
): CreateSaleInput {
  const items = data.lines
    .filter((line) => line.packQuantity > 0 || line.looseQuantity > 0)
    .map((line) => {
      const grossAmount = round2(
        line.packQuantity * line.saleRate +
          line.looseQuantity * (line.looseRate ?? 0),
      );
      return {
        productId: line.productId,
        batchId: line.batchId,
        packQuantity: line.packQuantity,
        saleRate: line.saleRate,
        looseQuantity: line.looseQuantity,
        looseRate: line.looseRate ?? 0,
        grossAmount,
        netAmount: grossAmount,
      };
    });

  return {
    type: SaleType.SALE_RETURN,
    originalSaleId: data.originalSaleId,
    customerName: data.customerName,
    saleDate: new Date().toISOString().slice(0, 10),
    remarks: data.remarks,
    discountPercent: data.discountPercent,
    taxPercent: data.taxPercent,
    items,
  };
}
