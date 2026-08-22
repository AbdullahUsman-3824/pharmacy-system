import { apiClient } from "../axios";
import type {
  BusinessContact,
  BusinessContactType,
  CreateBusinessContact,
  UpdateBusinessContact,
} from "@repo/shared";

export const businessContactApi = {
  list: async (params?: {
    type?: BusinessContactType;
    search?: string;
    isActive?: boolean;
  }): Promise<BusinessContact[]> => {
    const { data } = await apiClient.get("/business-contacts", { params });
    return data;
  },

  supplierOptions: async (
    search?: string,
  ): Promise<{ id: string; name: string }[]> => {
    const { data } = await apiClient.get("/business-contacts/suppliers/options", {
      params: { search },
    });
    return data;
  },

  customerOptions: async (
    search?: string,
  ): Promise<{ id: string; name: string }[]> => {
    const { data } = await apiClient.get("/business-contacts/customers/options", {
      params: { search },
    });
    return data;
  },

  getOne: async (id: string): Promise<BusinessContact> => {
    const { data } = await apiClient.get(`/business-contacts/${id}`);
    return data;
  },

  create: async (input: CreateBusinessContact): Promise<BusinessContact> => {
    const { data } = await apiClient.post("/business-contacts", input);
    return data;
  },

  update: async (
    id: string,
    input: UpdateBusinessContact,
  ): Promise<BusinessContact> => {
    const { data } = await apiClient.patch(`/business-contacts/${id}`, input);
    return data;
  },

  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`/business-contacts/${id}`);
  },
};
