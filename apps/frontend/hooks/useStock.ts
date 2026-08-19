import {
  useMutation,
  useQuery,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { stockApi } from "../lib/api/stockApi";
import { CreateStockVoucherInput, StockVoucherListQuery } from "@repo/shared";

export const stockKeys = {
  all: ["stock-vouchers"] as const,
  list: (query: StockVoucherListQuery) =>
    [...stockKeys.all, "list", query] as const,
  voucher: (id: string) => ["stock-voucher", id] as const,
  productStock: (productId: string) => ["stock-product", productId] as const,
};

export function useStockVouchers(query: StockVoucherListQuery) {
  return useQuery({
    queryKey: stockKeys.list(query),
    queryFn: () => stockApi.listVouchers(query),
    placeholderData: keepPreviousData,
  });
}

export function useStockVoucher(id: string) {
  return useQuery({
    queryKey: stockKeys.voucher(id),
    queryFn: () => stockApi.getVoucherById(id),
    enabled: !!id,
  });
}

export function useProductStock(productId: string) {
  return useQuery({
    queryKey: stockKeys.productStock(productId),
    queryFn: () => stockApi.getProductStock(productId),
    enabled: !!productId,
  });
}

export function useCreateStockVoucher() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateStockVoucherInput) =>
      stockApi.createVoucher(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: stockKeys.all });
      data.items.forEach((item) => {
        queryClient.invalidateQueries({
          queryKey: stockKeys.productStock(item.productId),
        });
      });
    },
  });
}
