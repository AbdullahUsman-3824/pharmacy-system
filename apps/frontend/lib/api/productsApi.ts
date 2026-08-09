import { apiClient } from "../axios";
import {
  ProductDto,
  CreateProductInput,
  UpdateProductInput,
} from "@repo/shared";

export type PaginatedProducts = {
  data: ProductDto[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
};

export const productsApi = {
  list: async (
    page = 1,
    limit = 100,
    q?: string,
  ): Promise<PaginatedProducts> => {
    const { data } = await apiClient.get("/products", {
      params: {
        page,
        limit,
        ...(q?.trim() ? { q: q.trim() } : {}),
      },
    });
    return data;
  },

  search: async (query: string, limit = 20): Promise<ProductDto[]> => {
    const { data } = await apiClient.get("/products/search", {
      params: {
        q: query,
        limit,
      },
    });

    return data;
  },

  getOne: async (id: string): Promise<ProductDto> => {
    const { data } = await apiClient.get(`/products/${id}`);
    return data;
  },

  create: async (input: CreateProductInput): Promise<ProductDto> => {
    const { data } = await apiClient.post("/products", input);
    return data;
  },

  update: async (
    id: string,
    input: UpdateProductInput,
  ): Promise<ProductDto> => {
    const { data } = await apiClient.patch(`/products/${id}`, input);
    return data;
  },

  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`/products/${id}`);
  },
};
