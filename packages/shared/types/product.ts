import { PaginatedResult } from "../query/paginated-result";

export interface CreateProductInput {
  code: string;
  barcode?: string;
  name: string;

  companyId: string;
  typeId: string;
  groupId?: string | null;
  genericId?: string | null;
  distributorId?: string | null;

  registrationNo?: string;
  originalReference?: string;

  // Packing
  packingSize: number;
  retailPrice?: number;
  retailDiscount?: number;
  tradePrice?: number;

  // Unit Rate
  retailRate?: number;
  tradeRate?: number;
  counterRatePercent?: number;
  orgRatePercent?: number;

  // Inventory
  minimumStock?: number;
  maximumStock?: number;
  shelfNo?: number;
  isActive?: boolean;
  nivFormulary?: boolean;
}

export type UpdateProductInput = Partial<CreateProductInput>;

// CORRECTED: the backend already returns nested company/type/group/generic
// objects (confirmed from actual API response) — only the TypeScript type
// was missing them. No backend change needed, just this type fix.

export interface LookupRef {
  id: string;
  name: string;
}

export interface ProductDto extends CreateProductInput {
  id: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  company: LookupRef;
  type: LookupRef;
  group: LookupRef | null;
  generic: LookupRef | null;
  distributor: LookupRef | null;
}

export interface ProductListItemDto {
  id: string;
  name: string;
  company: string;
  type: string;
  group: string;
  generic: string;
  retailPrice?: number;
}

export interface ProductsListResponse extends PaginatedResult<ProductListItemDto> {}
