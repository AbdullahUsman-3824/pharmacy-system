import { apiClient } from "../axios";
import type { SystemSettings, UpdateSystemSettingsInput } from "@repo/shared";

export const systemSettingsApi = {
  get: async (): Promise<SystemSettings> => {
    const { data } = await apiClient.get("/system-settings");
    return data;
  },

  update: async (input: UpdateSystemSettingsInput): Promise<SystemSettings> => {
    const { data } = await apiClient.patch("/system-settings", input);
    return data;
  },
};
