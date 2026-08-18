import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { stockApi } from "../lib/api/stockApi";
import { CreateStockVoucherInput } from "@repo/shared";

export const stockKeys = {
  vouchers: (params?: { skip?: number; take?: number; search?: string }) =>
    ["stock-vouchers", params] as const,
  voucher: (id: string) => ["stock-voucher", id] as const,
  productStock: (productId: string) => ["stock-product", productId] as const,
};

export function useStockVouchers(params?: {
  skip?: number;
  take?: number;
  search?: string;
}) {
  return useQuery({
    queryKey: stockKeys.vouchers(params),
    queryFn: () => stockApi.getVouchers(params),
    placeholderData: (previousData) => previousData,
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
      queryClient.invalidateQueries({ queryKey: stockKeys.vouchers() });
      data.items.forEach((item) => {
        queryClient.invalidateQueries({
          queryKey: stockKeys.productStock(item.productId),
        });
      });
    },
  });
}
