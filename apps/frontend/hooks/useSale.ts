import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { saleApi } from "../lib/api/saleApi";
import { CreateSaleInput } from "@repo/shared";
import { stockKeys } from "./useStock";

export const saleKeys = {
  sales: ["sales"] as const,
  sale: (id: string) => ["sale", id] as const,
};

export function useSales() {
  return useQuery({
    queryKey: saleKeys.sales,
    queryFn: saleApi.list,
  });
}

export function useSaleDetail(id: string) {
  return useQuery({
    queryKey: saleKeys.sale(id),
    queryFn: () => saleApi.getOne(id),
    enabled: !!id,
  });
}

export function useCreateSale() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateSaleInput) => saleApi.create(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: saleKeys.sales });

      // batch quantities changed — refresh stock views for every product sold
      data.items?.forEach((item) => {
        queryClient.invalidateQueries({
          queryKey: stockKeys.productStock(item.productId),
        });
      });

      // for a SALE_RETURN, the original sale's "already returned" totals changed
      if (data.originalSaleId) {
        queryClient.invalidateQueries({
          queryKey: saleKeys.sale(data.originalSaleId),
        });
      }
    },
  });
}
