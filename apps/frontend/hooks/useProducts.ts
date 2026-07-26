import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { productsApi } from "../lib/api/productsApi";
import { CreateProductInput, UpdateProductInput } from "@repo/shared";

/**
 * Full product list
 * (Admin pages, product management, reports)
 */
export function useProducts() {
  return useQuery({
    queryKey: ["products"],
    queryFn: productsApi.list,
  });
}

/**
 * Product search
 * (POS Combobox)
 */
export function useSearchProducts(search: string) {
  return useQuery({
    queryKey: ["products", "search", search],
    queryFn: () => productsApi.search(search),
    enabled: search.trim().length >= 2,
    placeholderData: (previousData) => previousData,
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ["products", id],
    queryFn: () => productsApi.getOne(id),
    enabled: !!id,
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateProductInput) => productsApi.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateProductInput }) =>
      productsApi.update(id, input),

    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({
        queryKey: ["products", variables.id],
      });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => productsApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}
