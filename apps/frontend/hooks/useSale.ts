import {
  useMutation,
  useQuery,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { saleApi } from "../lib/api/saleApi";
import { CreateSaleInput, SalesListQuery } from "@repo/shared";
import { stockKeys } from "./useStock";

export const saleKeys = {
  all: ["sales"] as const,
  list: (query: SalesListQuery) => [...saleKeys.all, "list", query] as const,
  sale: (id: string) => ["sale", id] as const,
  saleByNumber: (saleNumber: string) => ["sale", "number", saleNumber] as const,
  returnable: (id: string) => ["sale", id, "returnable"] as const,
};

export function useSales(query: SalesListQuery) {
  return useQuery({
    queryKey: saleKeys.list(query),
    queryFn: () => saleApi.list(query),
    placeholderData: keepPreviousData,
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
      queryClient.invalidateQueries({ queryKey: saleKeys.all });

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
