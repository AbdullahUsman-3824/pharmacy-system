import { apiClient } from "../axios";
import {
  ProductDto,
  CreateProductInput,
  UpdateProductInput,
  ProductsListQuery,
  ProductsListResponse,
} from "@repo/shared";

export interface ProductOption {
  id: string;
  name: string;
  packingSize: number;
}

export const productsApi = {
  list: async (params?: ProductsListQuery): Promise<ProductsListResponse> => {
    const { data } = await apiClient.get("/products", { params });
    return data;
  },

  options: async (search: string): Promise<ProductOption[]> => {
    const { data } = await apiClient.get("/products/options", {
      params: { search },
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
