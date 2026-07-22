export enum SaleType {
  SALE = "SALE",
  SALE_RETURN = "SALE_RETURN",
}

export interface CreateSaleItemInput {
  productId: string;
  batchId: string;
  quantity: number;
  saleRate: number;
  grossAmount: number;
  discountPercent?: number;
  discountAmount?: number;
  taxPercent?: number;
  taxAmount?: number;
  netAmount: number;
}

export interface CreateSaleInput {
  type: SaleType;
  customerName?: string;
  originalSaleId?: string;
  items: CreateSaleItemInput[];
}
