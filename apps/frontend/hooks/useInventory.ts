import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { inventoryApi } from "../lib/api/inventoryApi";
import type { InventoryListQuery } from "@repo/shared";

export const inventoryKeys = {
  all: ["inventory"] as const,
  list: (query: InventoryListQuery) =>
    [...inventoryKeys.all, "list", query] as const,
};

export function useInventory(query: InventoryListQuery) {
  return useQuery({
    queryKey: inventoryKeys.list(query),
    queryFn: () => inventoryApi.list(query),
    placeholderData: keepPreviousData,
  });
}
