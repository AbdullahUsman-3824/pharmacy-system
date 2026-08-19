import { apiClient } from "../axios";
import type { InventoryListQuery, InventoryListResponse } from "@repo/shared";

export const inventoryApi = {
  list: async (params?: InventoryListQuery): Promise<InventoryListResponse> => {
    const { data } = await apiClient.get("/stocks/inventory", { params });
    return data;
  },
};
