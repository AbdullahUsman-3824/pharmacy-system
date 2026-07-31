import { apiClient } from "../axios";
import {
  SaleDetailDto,
  SaleListResponse,
  ReturnableSaleDto,
  CreateSaleInput,
  SaleSearchDto,
} from "@repo/shared";

export const saleApi = {
  list: async (params?: {
    skip?: number;
    take?: number;
  }): Promise<SaleListResponse> => {
    const { data } = await apiClient.get("/sales", { params });
    return data;
  },

  getOne: async (id: string): Promise<SaleDetailDto> => {
    const { data } = await apiClient.get(`/sales/${id}`);
    return data;
  },

  getBySaleNumber: async (saleNumber: string): Promise<SaleDetailDto> => {
    const { data } = await apiClient.get(
      `/sales/number/${encodeURIComponent(saleNumber)}`,
    );
    return data;
  },

  search: async (query: string): Promise<SaleSearchDto[]> => {
    const { data } = await apiClient.get("/sales/search", {
      params: { query },
    });
    return data;
  },

  getReturnable: async (id: string): Promise<ReturnableSaleDto> => {
    const { data } = await apiClient.get(`/sales/${id}/returnable`);
    return data;
  },

  create: async (input: CreateSaleInput): Promise<SaleDetailDto> => {
    const { data } = await apiClient.post("/sales", input);
    return data;
  },
};
