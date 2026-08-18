import { PaginatedResult } from "../query/paginated-result";
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

export interface DistributorListItem {
  id: string;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  city?: string;
}

export interface DistributorsListResponse extends PaginatedResult<DistributorListItem> {}
