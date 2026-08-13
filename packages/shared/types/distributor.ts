// packages/shared/src/types/distributor.ts
export interface CreateDistributorInput {
  name: string;
  contactPerson?: string;
  phone?: string;
  mobile?: string;
  email?: string;
  address?: string;
  city?: string;
}

export type UpdateDistributorInput = Partial<CreateDistributorInput>;

export interface DistributorDto extends CreateDistributorInput {
  id: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}
