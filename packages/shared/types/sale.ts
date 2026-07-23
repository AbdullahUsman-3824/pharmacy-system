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
  saleDate: string;
  originalSaleId?: string | null;
  remarks?: string;
  items: CreateSaleItemInput[];
}

export interface SaleItemDto {
  id: string;
  saleId: string;
  productId: string;
  batchId: string;
  quantity: number;
  saleRate: number;
  grossAmount: number;
  discountPercent?: number | null;
  discountAmount: number;
  taxPercent?: number | null;
  taxAmount: number;
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
  discountAmount: number;
  taxAmount: number;
  netAmount: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  items?: SaleItemDto[];
}
