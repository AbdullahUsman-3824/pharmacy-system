// packages/shared/src/types/supplier.ts
export interface CreateSupplierInput {
  name: string;
  contactPerson?: string;
  phone?: string;
  mobile?: string;
  email?: string;
  address?: string;
  city?: string;
}

export type UpdateSupplierInput = Partial<CreateSupplierInput>;

export interface SupplierDto extends CreateSupplierInput {
  id: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}
