import { apiClient } from "../axios";
import {
  CreateStockVoucherInput,
  StockVoucherListResponse,
  StockVoucherOutput,
  ProductStockView,
} from "@repo/shared";

export const stockApi = {
  createVoucher: async (payload: CreateStockVoucherInput) => {
    const { data } = await apiClient.post<StockVoucherOutput>(
      "/stocks/vouchers",
      payload,
    );
    return data;
  },

  getVouchers: async (params?: {
    skip?: number;
    take?: number;
    search?: string;
  }) => {
    const { data } = await apiClient.get<StockVoucherListResponse>(
      "/stocks/vouchers",
      { params },
    );
    return data;
  },

  getVoucherById: async (id: string) => {
    const { data } = await apiClient.get<StockVoucherOutput>(
      `/stocks/vouchers/${id}`,
    );
    return data;
  },

  getProductStock: async (productId: string) => {
    const { data } = await apiClient.get<ProductStockView>(
      `/stocks/products/${productId}`,
    );
    return data;
  },
};
