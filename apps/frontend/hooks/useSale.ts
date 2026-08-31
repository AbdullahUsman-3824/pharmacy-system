import {
  useMutation,
  useQuery,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { saleApi } from "../lib/api/saleApi";
import { CreateSaleInput, SalesListQuery } from "@repo/shared";
import { stockKeys } from "./useStock";
import { distributorKeys } from "./useDistributors";

export const saleKeys = {
  all: ["sales"] as const,
  list: (query: SalesListQuery) => [...saleKeys.all, "list", query] as const,
  sale: (id: string) => ["sale", id] as const,
  saleByNumber: (saleNumber: string) => ["sale", "number", saleNumber] as const,
  returnable: (id: string) => ["sale", id, "returnable"] as const,
  productOptions: (search: string) =>
    [...distributorKeys.all, "product-options", search] as const,
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

export function useSaleProductOptions(search: string) {
  return useQuery({
    queryKey: saleKeys.productOptions(search),
    queryFn: () => saleApi.getProductOptions(search),
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateSale() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateSaleInput) => saleApi.create(payload),
    onSuccess: (data, variables) => {
      // Always invalidate sales list
      queryClient.invalidateQueries({ queryKey: saleKeys.all });

      // Invalidate stock for all products that were in the payload
      // (SerializedSale doesn't contain productIds)
      variables.items.forEach((item) => {
        queryClient.invalidateQueries({
          queryKey: stockKeys.productStock(item.productId),
        });
      });

      // If this was a return, invalidate the original sale + its returnable data
      if (variables.type === "SALE_RETURN" && variables.originalSaleId) {
        queryClient.invalidateQueries({
          queryKey: saleKeys.sale(variables.originalSaleId),
        });
        queryClient.invalidateQueries({
          queryKey: saleKeys.returnable(variables.originalSaleId),
        });
      }

      // Also invalidate the newly created sale (optional but useful)
      if (data?.id) {
        queryClient.invalidateQueries({
          queryKey: saleKeys.sale(data.id),
        });
      }
    },
  });
}
