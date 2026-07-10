import { apiClient } from "../axios";
import { LookupInterface, LookupType, LookupEntity } from "@repo/shared";

export const lookupsApi = {
  list: async (type: LookupType): Promise<LookupEntity[]> => {
    const { data } = await apiClient.get(`/lookups/${type}`);
    return data;
  },

  create: async (type: LookupType, name: string): Promise<LookupEntity> => {
    const { data } = await apiClient.post(`/lookups/${type}`, { name });
    return data;
  },

  update: async (
    type: LookupType,
    id: string,
    name: string,
  ): Promise<LookupInterface> => {
    const { data } = await apiClient.put(`/lookups/${type}/${id}`, { name });
    return data;
  },

  remove: async (type: LookupType, id: string): Promise<void> => {
    await apiClient.delete(`/lookups/${type}/${id}`);
  },
};
