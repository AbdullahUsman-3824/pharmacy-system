import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { saleApi } from "../lib/api/saleApi";
import { CreateSaleInput } from "@repo/shared";
import { stockKeys } from "./useStock";
import { useDebounce } from "./useDebounce";

export const saleKeys = {
  sales: (params?: { skip?: number; take?: number; search?: string }) =>
    [
      "sales",
      params?.skip ?? 0,
      params?.take ?? 20,
      params?.search?.trim() ?? "",
    ] as const,
  sale: (id: string) => ["sale", id] as const,
  saleByNumber: (saleNumber: string) => ["sale", "number", saleNumber] as const,
  returnable: (id: string) => ["sale", id, "returnable"] as const,
};

export function useSales(params?: {
  skip?: number;
  take?: number;
  search?: string;
}) {
  const debouncedSearch = useDebounce(params?.search ?? "", 300);
  const trimmedSearch = debouncedSearch.trim();

  return useQuery({
    queryKey: saleKeys.sales({ ...params, search: trimmedSearch }),
    queryFn: () =>
      saleApi.list({
        skip: params?.skip,
        take: params?.take,
        q: trimmedSearch || undefined,
      }),
    placeholderData: (prev) => prev,
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
