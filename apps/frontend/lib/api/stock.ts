import { apiClient } from "../axios";
import {
  CreateStockVoucherInput,
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
      await apiClient.get<StockVoucherOutput[]>("/stocks/vouchers");
    return data;
  },

  getProductStock: async (productId: string) => {
    const { data } = await apiClient.get<ProductStockView>(
      `/stocks/products/${productId}/stock`,
    );
    return data;
  },
};
