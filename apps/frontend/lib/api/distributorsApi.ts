import { apiClient } from "../axios";
import type {
  DistributorDto,
  CreateDistributorInput,
  UpdateDistributorInput,
  DistributorsListQuery,
  DistributorsListResponse,
} from "@repo/shared";

export const distributorsApi = {
  list: async (
    params?: DistributorsListQuery,
  ): Promise<DistributorsListResponse> => {
    const { data } = await apiClient.get("/distributors", { params });
    return data;
  },
  getOne: async (id: string): Promise<DistributorDto> => {
    const { data } = await apiClient.get(`/distributors/${id}`);
    return data;
  },
  create: async (input: CreateDistributorInput): Promise<DistributorDto> => {
    const { data } = await apiClient.post("/distributors", input);
    return data;
  },
  update: async (
    id: string,
    input: UpdateDistributorInput,
  ): Promise<DistributorDto> => {
    const { data } = await apiClient.patch(`/distributors/${id}`, input);
    return data;
  },
  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`/distributors/${id}`);
  },
};
