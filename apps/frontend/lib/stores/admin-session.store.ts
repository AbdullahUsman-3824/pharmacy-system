import { create } from "zustand";

interface AdminSessionState {
  unlocked: boolean;
  unlockedUntil: number | null;

  setUnlocked: (until: number) => void;
  setLocked: () => void;
  // helper
  isCurrentlyUnlocked: () => boolean;
}

export const useAdminSessionStore = create<AdminSessionState>((set, get) => ({
  unlocked: false,
  unlockedUntil: null,

  setUnlocked: (until: number) =>
    set({
      unlocked: true,
      unlockedUntil: until,
    }),

  setLocked: () =>
    set({
      unlocked: false,
      unlockedUntil: null,
    }),

  isCurrentlyUnlocked: () => {
    const { unlocked, unlockedUntil } = get();
    if (!unlocked || !unlockedUntil) return false;
    return Date.now() < unlockedUntil;
  },
}));
