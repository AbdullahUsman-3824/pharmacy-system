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

export interface UserResponse {
  id: string;
  name: string;
  type: UserType;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserListQuery {
  type?: UserType;
  search?: string;
}

export interface VerifyUserPinInput {
  userId: string;
  pin: string;
}

export type VerifyUserPinResponse =
  | {
      valid: false;
      userId: string;
    }
  | {
      valid: true;
      userId: string;
      name: string;
      type: UserType;
    };
