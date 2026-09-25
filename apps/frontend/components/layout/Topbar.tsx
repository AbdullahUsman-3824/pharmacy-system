"use client";

import { StatusBadge } from "@/components/ui/statusBadge";
import { AlertsBell } from "@/components/ui/alertsBell";
import { Clock } from "@/components/ui/clock";
import { KeyboardShortcuts } from "@/components/ui/keyboardShortcuts";
import { useAdminSessionStore } from "@/lib/stores/admin-session.store";
import { useLockAdminSession } from "@/hooks/useAdminSession";
import { useAdminPinModal } from "@/lib/context/AdminPinModalProvider";
import { Lock, Unlock } from "lucide-react";

interface TopbarProps {
  pharmacyName?: string;
}

export function Topbar({ pharmacyName = "Furqan Medicos" }: TopbarProps) {
  const unlocked = useAdminSessionStore((s) => s.unlocked);
  const setUnlocked = useAdminSessionStore((s) => s.setUnlocked);
  const setLocked = useAdminSessionStore((s) => s.setLocked);

  const lockMutation = useLockAdminSession();
  const { requestAdminUnlock } = useAdminPinModal();

  const handleToggle = async () => {
    if (unlocked) {
      await lockMutation.mutateAsync();
      setLocked();
    } else {
      try {
        const result = await requestAdminUnlock();
        setUnlocked(result.unlockedUntil);
      } catch {
        // cancelled
      }
    }
  };

  return (
    <header className="flex h-[var(--header-height)] items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-header)] px-6 py-2">
      <h1 className="text-sm font-semibold text-[var(--color-text)]">
        {pharmacyName}
      </h1>

      <div className="flex items-center gap-5">
        <button
          onClick={handleToggle}
          className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium transition-colors hover:bg-black/5"
          title={unlocked ? "Click to lock" : "Click to unlock"}
        >
          {unlocked ? (
            <>
              <Unlock size={14} className="text-green-600" />
              <span className="text-green-700">Unlocked</span>
            </>
          ) : (
            <>
              <Lock size={14} className="text-red-500" />
              <span className="text-red-600">Locked</span>
            </>
          )}
        </button>

        <KeyboardShortcuts />
        <AlertsBell />
        <StatusBadge label="Online" />
        <Clock />
      </div>
    </header>
  );
}
