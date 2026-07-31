import { apiClient } from "../axios";
import {
  SaleDetailDto,
  SaleListResponse,
  ReturnableSaleDto,
  SaleSearchResultDto,
  CreateSaleInput,
} from "@repo/shared";

export const saleApi = {
  list: async (params?: {
    skip?: number;
    take?: number;
  }): Promise<SaleListResponse> => {
    const { data } = await apiClient.get("/sales", { params });
    return data;
  },

  // Lightweight typeahead — separate from getOne/getBySaleNumber so the
  // dropdown never pulls full item/batch data on every keystroke.
  search: async (query: string): Promise<SaleSearchResultDto[]> => {
    const { data } = await apiClient.get("/sales/search", {
      params: { q: query },
    });
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

  getReturnable: async (id: string): Promise<ReturnableSaleDto> => {
    const { data } = await apiClient.get(`/sales/${id}/returnable`);
    return data;
  },

  create: async (input: CreateSaleInput): Promise<SaleDetailDto> => {
    const { data } = await apiClient.post("/sales", input);
    return data;
  },
};
