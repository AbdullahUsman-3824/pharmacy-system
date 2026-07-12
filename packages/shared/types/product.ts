export interface CreateProductInput {
  code: string;
  barcode?: string;
  name: string;

  companyId: string;
  typeId: string;
  groupId?: string | null;
  genericId?: string | null;
  defaultSupplierId?: string | null;

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

export interface ProductDto extends CreateProductInput {
  id: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}
