import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { apiClient } from "../lib/axios";
import type { InventoryListQuery, InventoryListResponse } from "@repo/shared";

export const inventoryKeys = {
  all: ["inventory"] as const,
  list: (query: InventoryListQuery) =>
    [...inventoryKeys.all, "list", query] as const,
};

export function useInventory(query: InventoryListQuery) {
  return useQuery({
    queryKey: inventoryKeys.list(query),
    queryFn: async () => {
      const { data } = await apiClient.get<InventoryListResponse>(
        "/stocks/inventory",
        {
          params: query,
        },
      );
      return data;
    },
    placeholderData: keepPreviousData,
  });
}
