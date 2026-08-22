import { apiClient } from "../axios";
import {
  SaleDetailDto,
  SalesListQuery,
  SaleListResponse,
  ReturnableSaleDto,
  CreateSaleInput,
  SaleProductOption,
} from "@repo/shared";

export const saleApi = {
  list: async (params?: SalesListQuery): Promise<SaleListResponse> => {
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

  getReturnable: async (id: string): Promise<ReturnableSaleDto> => {
    const { data } = await apiClient.get(`/sales/${id}/returnable`);
    return data;
  },

  create: async (input: CreateSaleInput): Promise<SaleDetailDto> => {
    const { data } = await apiClient.post("/sales", input);
    return data;
  },

  getProductOptions: async (search: string): Promise<SaleProductOption[]> => {
    const { data } = await apiClient.get("/sales/product-options", {
      params: { search },
    });
    return data;
  },
};
