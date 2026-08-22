export enum BusinessContactType {
  CUSTOMER = "CUSTOMER",
  SUPPLIER = "SUPPLIER",
}

export enum PaymentAccountType {
  CASH = "CASH",
  BANK = "BANK",
}

export enum PaymentType {
  SALE = "SALE",
  PURCHASE = "PURCHASE",
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
  isActive?: boolean;
}

export class CreatePaymentDto {
  paymentAccountId!: string;
  amount!: number;
}

export interface PaymentOutput {
  id: string;
  amount: number;
  paymentAccountId: string;
  paymentAccount: {
    id: string;
    name: string;
    type: PaymentAccountType;
  };
  createdAt: string;
}

export type UpdatePaymentAccount = Partial<CreatePaymentAccount>;

export interface PaymentOptions {
  cash: {
    id: string;
    name: string;
  };
  banks: {
    id: string;
    name: string;
  }[];
}
