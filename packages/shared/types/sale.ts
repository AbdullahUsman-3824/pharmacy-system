export enum SaleType {
  SALE = "SALE",
  SALE_RETURN = "SALE_RETURN",
}

export interface CreateSaleItemInput {
  productId: string;
  batchId: string;
  packQuantity: number; // whole packs sold on this line, 0 if none
  saleRate: number; // rate per pack
  looseQuantity: number; // loose units sold on this line, 0 if none
  looseRate: number; // rate per loose unit
  grossAmount: number;
  netAmount: number;
}

export interface CreateSaleInput {
  type: SaleType;
  customerName?: string;
  saleDate: string;
  originalSaleId?: string | null;
  remarks?: string;
  discountPercent?: number;
  taxPercent?: number;
  items: CreateSaleItemInput[];
}

export interface SaleItemDto {
  id: string;
  saleId: string;
  productId: string;
  batchId: string;
  packQuantity: number;
  saleRate: number;
  looseQuantity: number;
  looseRate: number;
  grossAmount: number;
  netAmount: number;
  createdAt: string;
  updatedAt: string;
}

export interface SaleDto {
  id: string;
  saleNumber: string;
  type: SaleType;
  date: string;
  customerName: string;
  originalSaleId?: string | null;
  remarks?: string | null;
  grossAmount: number;
  discountPercent?: number | null;
  discountAmount: number;
  taxPercent?: number | null;
  taxAmount: number;
  netAmount: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  items?: SaleItemDto[];
}
