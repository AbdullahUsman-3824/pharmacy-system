"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  ReactNode,
} from "react";
import { SaleFormInput } from "@/schemas/sale-form";

export interface HeldInvoice {
  id: string;
  heldAt: Date;
  customerId?: string;
  customerName?: string;
  items: SaleFormInput["items"];
  itemCount: number;
  netAmount: number;
}

interface HoldInput {
  customerId?: string;
  customerName?: string;
  items: SaleFormInput["items"];
  netAmount: number;
}

interface HeldInvoicesContextValue {
  heldInvoices: HeldInvoice[];
  hold: (input: HoldInput) => void;
  recall: (id: string) => HeldInvoice | undefined;
}

const HeldInvoicesContext = createContext<HeldInvoicesContextValue | null>(
  null,
);

const STORAGE_KEY = "pos:heldInvoices:v1";

function reviveHeldInvoices(raw: string): HeldInvoice[] {
  try {
    const parsed = JSON.parse(raw) as (Omit<HeldInvoice, "heldAt"> & {
      heldAt: string;
    })[];
    return parsed.map((h) => ({ ...h, heldAt: new Date(h.heldAt) }));
  } catch {
    return [];
  }
}

// Lazy initializer: reads localStorage synchronously during first render.
// This is safe because it only runs on the client (SSR guard below).
function getInitialHeldInvoices(): HeldInvoice[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(STORAGE_KEY);
  return raw ? reviveHeldInvoices(raw) : [];
}

export function HeldInvoicesProvider({ children }: { children: ReactNode }) {
  const [heldInvoices, setHeldInvoices] = useState<HeldInvoice[]>(
    getInitialHeldInvoices, // ← lazy initializer, runs only on first render
  );
  const hydrated = useRef(false);

  // Mark hydration as complete so the persistence effect can start writing.
  useEffect(() => {
    hydrated.current = true;
  }, []);

  // Persist on every change, skipping the very first render before
  // hydration has run.
  useEffect(() => {
    if (!hydrated.current || typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(heldInvoices));
  }, [heldInvoices]);

  const hold = useCallback((input: HoldInput) => {
    setHeldInvoices((prev) => [
      ...prev,
      {
        ...input,
        id: crypto.randomUUID(),
        heldAt: new Date(),
        itemCount: input.items.length,
      },
    ]);
  }, []);

  const recall = useCallback(
    (id: string) => {
      const invoice = heldInvoices.find((h) => h.id === id);
      setHeldInvoices((prev) => prev.filter((h) => h.id !== id));
      return invoice;
    },
    [heldInvoices],
  );

  return (
    <HeldInvoicesContext.Provider value={{ heldInvoices, hold, recall }}>
      {children}
    </HeldInvoicesContext.Provider>
  );
}

export function useHeldInvoices() {
  const ctx = useContext(HeldInvoicesContext);
  if (!ctx) {
    throw new Error(
      "useHeldInvoices must be used within a HeldInvoicesProvider — wrap it around the POS layout (or the app root) once, not per-page.",
    );
  }
  return ctx;
}
