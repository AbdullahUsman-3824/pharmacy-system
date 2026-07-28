// hooks/useHeldInvoices.ts
"use client";

import { useState } from "react";
import { SaleFormInput } from "@/schemas/sale-form";

export interface HeldInvoice {
  id: string;
  heldAt: Date;
  customerName: string;
  items: SaleFormInput["items"];
}

export function useHeldInvoices() {
  const [heldInvoices, setHeldInvoices] = useState<HeldInvoice[]>([]);

  const hold = (invoice: Omit<HeldInvoice, "id" | "heldAt">) => {
    setHeldInvoices((prev) => [
      ...prev,
      { ...invoice, id: crypto.randomUUID(), heldAt: new Date() },
    ]);
  };

  const recall = (id: string) => {
    const invoice = heldInvoices.find((h) => h.id === id);
    setHeldInvoices((prev) => prev.filter((h) => h.id !== id));
    return invoice;
  };

  return { heldInvoices, hold, recall };
}
