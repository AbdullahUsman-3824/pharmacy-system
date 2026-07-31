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


export interface SaleItemBatchDto {
  id: string;
  batchNumber: string;
  expiryDate?: string | null;
  purchaseRate: number;
  saleRate: number;
  openingQuantity: number;
  currentQuantity: number;
  looseQuantity: number;
  manufacturingDate?: string | null;
  isActive: boolean;
}

export interface SaleItemDetailDto extends SaleItemDto {
  productName?: string;
  batch: SaleItemBatchDto;
}

export interface SaleDetailDto extends Omit<SaleDto, "items"> {
  items: SaleItemDetailDto[];
}

export interface SaleListResponse {
  data: SaleDto[];
  total: number;
  skip: number;
  take: number;
}

export interface ReturnableItemDto {
  productId: string;
  productName?: string;
  batchId: string;
  batchNumber?: string;
  saleRate: number;
  looseRate: number | null;
  originalPackQuantity: number;
  originalLooseQuantity: number;
  alreadyReturnedPacks: number;
  alreadyReturnedLoose: number;
  availablePacksToReturn: number;
  availableLooseToReturn: number;
}

export interface ReturnableSaleDto {
  saleId: string;
  saleNumber: string;
  items: ReturnableItemDto[];
}

export interface SaleSearchResultDto {
  id: string;
  saleNumber: string;
  customerName: string;
  date: string;
  netAmount: number;
}
