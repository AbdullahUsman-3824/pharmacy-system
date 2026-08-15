export enum UserType {
  OWNER = "OWNER",
  STAFF = "STAFF",
}

export interface User {
  id: string;
  name: string;
  pin: string;
  type: UserType;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserInput {
  name: string;
  pin: string;
  type: UserType;
  isActive?: boolean;
}

export interface UpdateUserInput {
  name?: string;
  pin?: string;
  type?: UserType;
  isActive?: boolean;
}
