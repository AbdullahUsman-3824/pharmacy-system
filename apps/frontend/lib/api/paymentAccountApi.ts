import { apiClient } from "../axios";
import type {
  PaymentAccount,
  PaymentOptions,
  CreatePaymentAccount,
  UpdatePaymentAccount,
} from "@repo/shared";

export const paymentAccountApi = {
  options: async (): Promise<PaymentOptions> => {
    const { data } = await apiClient.get("/payment-accounts/options");
    return data;
  },

  list: async (params?: { isActive?: boolean }): Promise<PaymentAccount[]> => {
    const { data } = await apiClient.get("/payment-accounts", { params });
    return data;
  },

  getOne: async (id: string): Promise<PaymentAccount> => {
    const { data } = await apiClient.get(`/payment-accounts/${id}`);
    return data;
  },

  create: async (input: CreatePaymentAccount): Promise<PaymentAccount> => {
    const { data } = await apiClient.post("/payment-accounts", input);
    return data;
  },

  update: async (
    id: string,
    input: UpdatePaymentAccount,
  ): Promise<PaymentAccount> => {
    const { data } = await apiClient.patch(`/payment-accounts/${id}`, input);
    return data;
  },

  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`/payment-accounts/${id}`);
  },
};
