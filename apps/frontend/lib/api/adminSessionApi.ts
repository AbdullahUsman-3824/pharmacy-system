import { apiClient } from "../axios";
import {
  AdminSessionStatus,
  UnlockAdminInput,
  UnlockAdminResponse,
  LockAdminResponse,
} from "@repo/shared";

export const adminSessionApi = {
  status: async (): Promise<AdminSessionStatus> => {
    const { data } = await apiClient.get("/admin-session/status");
    return data;
  },

  unlock: async (input: UnlockAdminInput): Promise<UnlockAdminResponse> => {
    const { data } = await apiClient.post("/admin-session/unlock", input);
    return data;
  },

  lock: async (): Promise<LockAdminResponse> => {
    const { data } = await apiClient.post("/admin-session/lock");
    return data;
  },
};
