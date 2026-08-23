import { apiClient } from "../axios";
import type {
  CreateUserInput,
  UpdateUserInput,
  User,
  UserType,
  UserResponse,
  UserListQuery,
  VerifyUserPinInput,
  VerifyUserPinResponse,
} from "@repo/shared";

export const userApi = {
  list: async (params?: UserListQuery): Promise<UserResponse[]> => {
    const { data } = await apiClient.get("/user", { params });
    return data;
  },

  getOne: async (id: string): Promise<UserResponse> => {
    const { data } = await apiClient.get(`/user/${id}`);
    return data;
  },

  create: async (input: CreateUserInput): Promise<User> => {
    const { data } = await apiClient.post("/user", input);
    return data;
  },

  update: async (id: string, input: UpdateUserInput): Promise<User> => {
    const { data } = await apiClient.patch(`/user/${id}`, input);
    return data;
  },

  remove: async (id: string): Promise<{ message: string; id: string }> => {
    const { data } = await apiClient.delete(`/user/${id}`);
    return data;
  },

  verifyPin: async (
    input: VerifyUserPinInput,
  ): Promise<VerifyUserPinResponse> => {
    const { data } = await apiClient.post("/user/verify-pin", input);
    return data;
  },
};
