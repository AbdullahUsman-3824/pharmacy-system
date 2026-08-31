import { SaleType, CreateSaleInput } from "@repo/shared";
import { SaleReturnFormOutput } from "@/schemas/sale-return-form";

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function buildReturnPayload(
  data: SaleReturnFormOutput,
  paymentAccountId: string,
  creatorPin: string,
): CreateSaleInput {
  const items = data.lines
    .filter((line) => line.packQuantity > 0 || line.looseQuantity > 0)
    .map((line) => {
      const unitQuantity =
        line.packQuantity * line.packingSize + line.looseQuantity;
      const grossAmount = round2(unitQuantity * line.saleRate);

      return {
        productId: line.productId,
        batchId: line.batchId,
        packQuantity: line.packQuantity,
        looseQuantity: line.looseQuantity,
        saleRate: line.saleRate,
        grossAmount,
        netAmount: grossAmount,
      };
    });

  const grossTotal = items.reduce((s, i) => s + i.grossAmount, 0);
  const discount = round2(grossTotal * ((data.discountPercent || 0) / 100));
  const taxable = grossTotal - discount;
  const tax = round2(taxable * ((data.taxPercent || 0) / 100));
  const netTotal = round2(taxable + tax);

  return {
    type: SaleType.SALE_RETURN,
    originalSaleId: data.originalSaleId,
    customerId: data.customerId || undefined,
    saleDate: new Date().toISOString().slice(0, 10),
    remarks: data.remarks,
    discountPercent: data.discountPercent || 0,
    taxPercent: data.taxPercent || 0,
    items,
    creatorPin,
    payments: [
      {
        paymentAccountId,
        amount: netTotal,
      },
    ],
  };
}
