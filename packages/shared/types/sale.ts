import { CreatePaymentDto, PaymentOutput } from "./accounts";
import { PaginatedResult } from "../query/paginated-result";
import { ProductSummary, BatchSummary } from "./stock";

export enum SaleType {
  SALE = "SALE",
  SALE_RETURN = "SALE_RETURN",
}

// ======================================================
// Sale Item — shared base between input/output
// ======================================================

interface SaleItemBase {
  productId: string;
  batchId: string;
  packQuantity: number;
  looseQuantity: number;
  saleRate: number;
  grossAmount: number;
  netAmount: number;
}

export interface CreateSaleItemInput extends SaleItemBase {}

export interface SaleItemDto extends SaleItemBase {
  id: string;
  saleId: string;
  createdAt: string;
  updatedAt: string;
}

// ======================================================
// Sale — shared base between input/output
// ======================================================

interface SaleBase {
  type: SaleType;
  customerId?: string | null;
  originalSaleId?: string | null;
  remarks?: string | null;
  discountPercent?: number | null;
  taxPercent?: number | null;
}

export interface CreateSaleInput extends SaleBase {
  saleDate: string;
  items: CreateSaleItemInput[];
  payments: CreatePaymentDto[];
}

export interface SaleDto extends SaleBase {
  id: string;
  saleNumber: string;
  date: string;
  customer: string | null;
  grossAmount: number;
  discountAmount: number;
  taxAmount: number;
  netAmount: number;
  createdBy: string | null;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
  items?: SaleItemDto[];
  payments?: PaymentOutput[];
}

// ======================================================
// Sale detail (item-level product/batch info)
// ======================================================

export interface SaleItemBatchDto extends BatchSummary {
  purchaseRate: number;
  saleRate: number;
  openingQuantity: number;
  currentQuantity: number;
  manufacturingDate?: string | null;
  isActive: boolean;
}

export interface SaleItemDetailDto extends SaleItemDto {
  product: ProductSummary;
  batch: SaleItemBatchDto;
}

export interface SaleDetailDto extends Omit<SaleDto, "items"> {
  items: SaleItemDetailDto[];
}

export interface SaleListResponse extends PaginatedResult<SaleDto> {}

// ======================================================
// Returns
// ======================================================

export interface ReturnableItemDto {
  productId: string;
  productName?: string;
  batchId: string;
  batchNumber?: string;
  saleRate: number;
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

// ======================================================
// Sale product picker (for POS/sale item selection)
// ======================================================

export interface SaleProductOption {
  id: string;
  name: string;
  currentQuantity: number | null;
}
