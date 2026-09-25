"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { PinModal } from "@/components/shared/PinModal";
import { useUnlockAdminSession } from "@/hooks/useAdminSession";
import type { UnlockAdminResponse } from "@repo/shared";
import { adminSessionApi } from "@/lib/api/adminSessionApi";

interface PendingUnlock {
  id: number;
  resolve: (value: UnlockAdminResponse) => void;
  reject: (reason?: unknown) => void;
}

interface AdminPinModalContextValue {
  requestAdminUnlock: () => Promise<UnlockAdminResponse>;
}

const AdminPinModalContext = createContext<AdminPinModalContextValue | null>(
  null,
);

const cancelError = () => new Error("Admin unlock cancelled");

function toMessage(err: unknown): string {
  if (typeof err === "object" && err !== null) {
    const e = err as {
      response?: { data?: { message?: unknown } };
      message?: unknown;
    };
    const fromResponse = e.response?.data?.message;
    if (typeof fromResponse === "string" && fromResponse) return fromResponse;
    if (typeof e.message === "string" && e.message) return e.message;
  }
  return "Invalid PIN. Please try again.";
}

export function AdminPinModalProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [pending, setPending] = useState<PendingUnlock | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { mutateAsync, isPending } = useUnlockAdminSession();

  const pendingRef = useRef<PendingUnlock | null>(null);
  const nextIdRef = useRef(0);

  const commitPending = useCallback((next: PendingUnlock | null) => {
    pendingRef.current = next;
    setPending(next);
  }, []);

  const requestAdminUnlock = useCallback(() => {
    return new Promise<UnlockAdminResponse>((resolve, reject) => {
      const superseded = pendingRef.current;
      const next: PendingUnlock = { id: ++nextIdRef.current, resolve, reject };

      setError(null);
      commitPending(next);
      superseded?.reject(cancelError());
    });
  }, [commitPending]);

  const handleConfirm = useCallback(
    async (pin: string) => {
      const session = pendingRef.current;
      if (!session) return;

      try {
        const result = await mutateAsync({ pin });
        // Bail if this session was cancelled or superseded mid-flight.
        if (pendingRef.current?.id !== session.id) return;
        session.resolve(result);
        commitPending(null);
        setError(null);
        const status = await adminSessionApi.status();
        console.log(status);
      } catch (err) {
        if (pendingRef.current?.id !== session.id) return;
        setError(toMessage(err));
      }
    },
    [commitPending, mutateAsync],
  );

  const handleClose = useCallback(() => {
    const session = pendingRef.current;
    commitPending(null);
    setError(null);
    // Reject last: the caller's catch may synchronously re-open the modal.
    session?.reject(cancelError());
  }, [commitPending]);

  // Don't leave an awaiting caller hanging if the provider goes away.
  useEffect(() => {
    return () => {
      pendingRef.current?.reject(cancelError());
      pendingRef.current = null;
    };
  }, []);

  const value = useMemo(() => ({ requestAdminUnlock }), [requestAdminUnlock]);

  return (
    <AdminPinModalContext.Provider value={value}>
      {children}

      <PinModal
        isOpen={pending !== null}
        onClose={handleClose}
        onConfirm={handleConfirm}
        title="Admin Unlock"
        description={
          error ?? "Enter the admin PIN to unlock protected actions."
        }
        confirmLabel={isPending ? "Unlocking..." : "Unlock"}
        cancelLabel="Cancel"
      />
    </AdminPinModalContext.Provider>
  );
}

export function useAdminPinModal() {
  const ctx = useContext(AdminPinModalContext);
  if (!ctx) {
    throw new Error(
      "useAdminPinModal must be used inside AdminPinModalProvider",
    );
  }
  return ctx;
}
