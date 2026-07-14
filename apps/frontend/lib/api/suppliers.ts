import { apiClient } from "../axios";
import type {
  SupplierDto,
  CreateSupplierInput,
  UpdateSupplierInput,
} from "@repo/shared";

export const suppliersApi = {
  list: async (): Promise<SupplierDto[]> => {
    const { data } = await apiClient.get("/suppliers");
    return data;
  },
  getOne: async (id: string): Promise<SupplierDto> => {
    const { data } = await apiClient.get(`/suppliers/${id}`);
    return data;
  },
  create: async (input: CreateSupplierInput): Promise<SupplierDto> => {
    const { data } = await apiClient.post("/suppliers", input);
    return data;
  },
  update: async (
    id: string,
    input: UpdateSupplierInput,
  ): Promise<SupplierDto> => {
    const { data } = await apiClient.patch(`/suppliers/${id}`, input);
    return data;
  },
  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`/suppliers/${id}`);
  },
};
