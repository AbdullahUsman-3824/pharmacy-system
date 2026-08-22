import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { productsApi } from "../lib/api/productsApi";
import {
  CreateProductInput,
  UpdateProductInput,
  ProductsListQuery,
} from "@repo/shared";
import { AxiosError } from "axios";
import { toast } from "sonner";

export const productKeys = {
  all: ["products"] as const,
  list: (query: ProductsListQuery) =>
    [...productKeys.all, "list", query] as const,
  search: (search: string) => [...productKeys.all, "search", search] as const,
  detail: (id: string) => [...productKeys.all, id] as const,
  options: (search: string) => [...productKeys.all, "options", search] as const,
};

export function useProducts(query: ProductsListQuery) {
  return useQuery({
    queryKey: productKeys.list(query),
    queryFn: () => productsApi.list(query),
    placeholderData: keepPreviousData,
  });
}

export function useProductsOptions(search: string) {
  return useQuery({
    queryKey: productKeys.options(search),
    queryFn: () => productsApi.options(search),
  });
}

export function useSearchProducts(search: string) {
  return useQuery({
    queryKey: productKeys.search(search),
    queryFn: () => productsApi.search(search),
    enabled: search.trim().length >= 2,
    placeholderData: keepPreviousData,
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: productKeys.detail(id),
    queryFn: () => productsApi.getOne(id),
    enabled: !!id,
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateProductInput) => productsApi.create(input),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.all });
      toast.success("Product added successfully.");
    },

    onError: (error) => {
      const message =
        error instanceof AxiosError
          ? (error.response?.data?.message ?? "Failed to create product.")
          : error.message;
      toast.error(message);
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateProductInput }) =>
      productsApi.update(id, input),

    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: productKeys.all });
      queryClient.invalidateQueries({
        queryKey: productKeys.detail(variables.id),
      });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => productsApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.all });
    },
  });
}
