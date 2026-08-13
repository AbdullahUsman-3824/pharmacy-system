// account.types.ts

export enum BusinessContactType {
  CUSTOMER = "CUSTOMER",
  DISTRIBUTOR = "DISTRIBUTOR",
}

export enum PaymentAccountType {
  CASH = "CASH",
  BANK = "BANK",
}

// ==================== Business Contact ====================

export interface BusinessContact {
  id: string;
  name: string;
  type: BusinessContactType;
  phone?: string | null;
  address?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBusinessContact {
  name: string;
  type: BusinessContactType;
  phone?: string;
  address?: string;
  isActive?: boolean;
}

export type UpdateBusinessContact = Partial<CreateBusinessContact>;

// ==================== Payment Account ====================

export interface PaymentAccount {
  id: string;
  name: string;
  type: PaymentAccountType;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePaymentAccount {
  name: string;
  type: PaymentAccountType;
  isActive?: boolean;
}

export type UpdatePaymentAccount = Partial<CreatePaymentAccount>;
