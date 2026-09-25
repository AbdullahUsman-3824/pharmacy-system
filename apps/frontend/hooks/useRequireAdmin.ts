"use client";

import { useCallback } from "react";
import { useAdminPinModal } from "@/lib/context/AdminPinModalProvider";
import { useAdminSessionStore } from "@/lib/stores/admin-session.store";

/**
 * Ensures admin session is unlocked.
 * - Agar already unlocked hai → silently continue
 * - Warna PIN modal kholta hai aur wait karta hai
 */
export function useRequireAdmin() {
  const { requestAdminUnlock } = useAdminPinModal();
  const unlocked = useAdminSessionStore((s) => s.unlocked);
  const unlockedUntil = useAdminSessionStore((s) => s.unlockedUntil);
  const setUnlocked = useAdminSessionStore((s) => s.setUnlocked);

  const requireAdmin = useCallback(async () => {
    // Already unlocked?
    if (unlocked && unlockedUntil && Date.now() < unlockedUntil) {
      return;
    }

    // Locked → PIN modal
    const result = await requestAdminUnlock();
    setUnlocked(result.unlockedUntil);
  }, [requestAdminUnlock, unlocked, unlockedUntil, setUnlocked]);

  return { requireAdmin };
}
