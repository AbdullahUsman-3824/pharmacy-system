import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { saleApi } from "../lib/api/saleApi";
import { CreateSaleInput } from "@repo/shared";
import { stockKeys } from "./useStock";
import { useDebounce } from "./useDebounce";

export const saleKeys = {
  sales: (params?: { skip?: number; take?: number }) =>
    ["sales", params?.skip ?? 0, params?.take ?? 100] as const,
  sale: (id: string) => ["sale", id] as const,
  saleByNumber: (saleNumber: string) => ["sale", "number", saleNumber] as const,
  search: (query: string) => ["sale-search", query] as const,
  returnable: (id: string) => ["sale", id, "returnable"] as const,
};

export function useSaleSearch(query: string) {
  const debounced = useDebounce(query, 300);
  const trimmed = debounced.trim();

  return useQuery({
    queryKey: saleKeys.search(trimmed),
    queryFn: () => saleApi.search(trimmed),
    enabled: trimmed.length >= 2,
    placeholderData: (prev) => prev,
  });
}

export function useSales(params?: { skip?: number; take?: number }) {
  return useQuery({
    queryKey: saleKeys.sales(params),
    queryFn: () => saleApi.list(params),
  });
}

export function useSaleDetail(id: string) {
  return useQuery({
    queryKey: saleKeys.sale(id),
    queryFn: () => saleApi.getOne(id),
    enabled: !!id,
  });
}

export function useSaleBySaleNumber(saleNumber: string) {
  return useQuery({
    queryKey: saleKeys.saleByNumber(saleNumber),
    queryFn: () => saleApi.getBySaleNumber(saleNumber),
    enabled: !!saleNumber,
  });
}

export function useReturnableItems(saleId: string) {
  return useQuery({
    queryKey: saleKeys.returnable(saleId),
    queryFn: () => saleApi.getReturnable(saleId),
    enabled: !!saleId,
  });
}

export function useCreateSale() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateSaleInput) => saleApi.create(payload),
    onSuccess: (data) => {
      // list queries are keyed as ["sales", skip, take] — invalidate by
      // the shared "sales" prefix so every page/variant refreshes
      queryClient.invalidateQueries({ queryKey: ["sales"] });

      data.items?.forEach((item) => {
        queryClient.invalidateQueries({
          queryKey: stockKeys.productStock(item.productId),
        });
      });

      if (data.originalSaleId) {
        queryClient.invalidateQueries({
          queryKey: saleKeys.sale(data.originalSaleId),
        });
        queryClient.invalidateQueries({
          queryKey: saleKeys.returnable(data.originalSaleId),
        });
      }
    },
  });
}
