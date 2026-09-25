export type AdminSessionStatus = {
  unlocked: boolean;
  unlockedUntil: number | null;
  adminUserId?: string;
};

export type UnlockAdminInput = {
  pin: string;
};

export type UnlockAdminResponse = {
  unlockedUntil: number;
};

export type LockAdminResponse = {
  locked: boolean;
};
