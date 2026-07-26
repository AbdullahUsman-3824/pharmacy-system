import { apiClient } from "../axios";
import { SaleDto, CreateSaleInput } from "@repo/shared";

export const saleApi = {
  list: async (): Promise<SaleDto[]> => {
    const { data } = await apiClient.get("/sales");
    return data;
  },

  getOne: async (id: string): Promise<SaleDto> => {
    const { data } = await apiClient.get(`/sales/${id}`);
    return data;
  },

  create: async (input: CreateSaleInput): Promise<SaleDto> => {
    const { data } = await apiClient.post("/sales", input);
    return data;
  },
};
