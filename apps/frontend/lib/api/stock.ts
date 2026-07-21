import { apiClient } from "../axios";
import {
  CreateStockVoucherInput,
  StockVoucherListItem,
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

  getVouchers: async () => {
    const { data } =
      await apiClient.get<StockVoucherListItem[]>("/stocks/vouchers");
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
      `/stocks/products/${productId}/stock`,
    );
    return data;
  },
};
