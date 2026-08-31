"use client";

import { useState, useRef, useMemo, useEffect } from "react";
import { useForm, useWatch, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  saleFormSchema,
  SaleFormInput,
  SaleFormOutput,
  SaleItemValues,
} from "@/schemas/sale-form";
import { buildCreateSalePayload } from "./build-payload";
import { useCreateSale } from "@/hooks/useSale";
import { usePinModal } from "@/hooks/usePinModal";
import {
  PosHeader,
  StockError,
  ItemsTable,
  SaleEntryRowRef,
  SalePayment,
  SalePaymentRef,
  SaleSummary,
  SaleSummaryRef,
} from ".";
import { useHeldInvoices } from "@/lib/context/HeldInvoicesContext";
import { RecallHeldPopover, SaleCompleteModal } from ".";
import type { SerializedSale } from "@repo/shared";
import { usePageShortcuts } from "@/lib/shortcuts/usePageShortcuts";
import type { PaymentOption } from "@/components/shared/payment-select";
import { toast } from "sonner";
import {
  getLastDiscountPercent,
  getLastTaxPercent,
  setLastDiscountPercent,
  setLastTaxPercent,
} from "@/lib/last-sale-defaults";

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function buildDefaultValues(): SaleFormInput {
  return {
    customerId: "",
    saleDate: new Date().toISOString().slice(0, 10),
    remarks: "",
    discountPercent: getLastDiscountPercent(),
    taxPercent: getLastTaxPercent(),
    items: [],
    payments: [],
  };
}

export default function PosPage() {
  const createSale = useCreateSale();

  const {
    register,
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<SaleFormInput, unknown, SaleFormOutput>({
    resolver: zodResolver(saleFormSchema),
    defaultValues: buildDefaultValues(),
  });

  const { fields, insert, remove, replace } = useFieldArray({
    control,
    name: "items",
  });
  const items = useWatch({ control, name: "items" });
  const customerId = useWatch({ control, name: "customerId" });
  const discountPercent = (useWatch({ control, name: "discountPercent" }) ??
    0) as number;
  const taxPercent = (useWatch({ control, name: "taxPercent" }) ?? 0) as number;

  const [stockError, setStockError] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [completedSale, setCompletedSale] = useState<SerializedSale | null>(
    null,
  );
  const [showRecallPopover, setShowRecallPopover] = useState(false);
  const [customerLabel, setCustomerLabel] = useState("");

  const [selectedPayment, setSelectedPayment] = useState<PaymentOption | null>(
    null,
  );

  const entryRowRef = useRef<SaleEntryRowRef>(null);
  const paymentRef = useRef<SalePaymentRef>(null);
  const summaryRef = useRef<SaleSummaryRef>(null);

  const handleAddItem = (item: SaleItemValues) => {
    insert(0, item);
    setTimeout(() => {
      const newItem = document.querySelector(`[data-item-index="0"]`);
      if (newItem) {
        newItem.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 100);
  };

  const totals = useMemo(() => {
    const gross = (items ?? []).reduce((sum, item) => {
      const ps = Number(item?.packingSize) || 1;
      const units =
        (Number(item?.packQuantity) || 0) * ps +
        (Number(item?.looseQuantity) || 0);
      const unitRate = Number(item?.saleRate) || 0;
      return sum + units * unitRate;
    }, 0);
    const discount = round2(gross * (Number(discountPercent) / 100));
    const taxable = gross - discount;
    const tax = round2(taxable * (Number(taxPercent) / 100));
    const net = round2(taxable + tax);
    return { gross, discount, tax, net };
  }, [items, discountPercent, taxPercent]);

  useEffect(() => {
    if (selectedPayment) {
      setValue("payments", [
        { paymentAccountId: selectedPayment.id, amount: totals.net },
      ]);
    } else {
      setValue("payments", []);
    }
  }, [selectedPayment, totals.net, setValue]);

  const { getPin, PinModalElement } = usePinModal();

  const onSubmit = async (data: SaleFormOutput) => {
    setStockError(null);
    setPaymentError(null);

    if (!selectedPayment) {
      const errorMsg = "Please select a payment method.";
      setPaymentError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    try {
      const pin = await getPin("salesman");
      if (!pin) {
        toast.error("PIN verification cancelled or failed.");
        return;
      }

      const payload = buildCreateSalePayload(data, pin);
      const result = await createSale.mutateAsync(payload);
      setCompletedSale(result);
      toast.success("Sale completed successfully!");
    } catch (error: unknown) {
      // Handle errors from the apiClient interceptor
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to create sale. Please try again.";

      // Check for stock error
      if (
        errorMessage.includes("INSUFFICIENT_STOCK") ||
        errorMessage.toLowerCase().includes("stock")
      ) {
        // Try to extract available/requested quantities
        const match = errorMessage.match(
          /Available:\s*(\d+),\s*requested:\s*(\d+)/i,
        );
        let detailedMsg = "Not enough stock available for this item.";
        if (match) {
          detailedMsg = `Not enough stock available. Available: ${match[1]}, requested: ${match[2]}.`;
        }
        setStockError(detailedMsg);
        toast.error(detailedMsg);
        return;
      }

      // Check for PIN error
      if (
        errorMessage.toLowerCase().includes("pin") ||
        errorMessage.toLowerCase().includes("incorrect pin")
      ) {
        toast.error("Incorrect PIN. Please try again.");
        return;
      }

      // Handle all other errors
      toast.error(errorMessage);
      console.error("Sale creation error:", error);
    }
  };

  const handleCompleteSale = () => {
    if (!selectedPayment) {
      const errorMsg = "Please select a payment method.";
      setPaymentError(errorMsg);
      toast.error(errorMsg);
      return;
    }
    setPaymentError(null);
    handleSubmit(onSubmit)();
  };

  const resetPayment = () => {
    setSelectedPayment(null);
    setPaymentError(null);
  };

  const handleNewSale = () => {
    setCompletedSale(null);
    replace([]);
    reset(buildDefaultValues());
    setCustomerLabel("");
    resetPayment();
    requestAnimationFrame(() => entryRowRef.current?.focus());
  };

  const handlePrint = () => {
    // TODO: wire real print/receipt logic once print format is decided.
    console.log("Print", completedSale);
  };

  const { heldInvoices, hold, recall } = useHeldInvoices();

  const holdCurrentCart = () => {
    if (!items || items.length === 0) {
      toast.warning("Cart is empty. Add items before holding.");
      return;
    }
    hold({
      customerId: customerId || undefined,
      customerName: customerId ? customerLabel : undefined,
      items: items as SaleFormInput["items"],
      netAmount: totals.net,
    });
    replace([]);
    reset(buildDefaultValues());
    resetPayment();
    toast.success("Invoice held successfully!");
  };

  const handleOpenRecall = () => {
    if (heldInvoices.length === 0) {
      toast.info("No held invoices to recall.");
      return;
    }
    setShowRecallPopover(true);
  };

  const handleSelectHeld = (id: string) => {
    if (items && items.length > 0) {
      holdCurrentCart();
    }
    const recalled = recall(id);
    if (recalled) {
      replace(recalled.items);
      setValue("customerId", recalled.customerId ?? "");
      setCustomerLabel(recalled.customerName ?? "");
      toast.success("Invoice recalled successfully!");
    } else {
      toast.error("Failed to recall invoice.");
    }
    setShowRecallPopover(false);
  };

  const handleClear = () => {
    if (!items || items.length === 0) {
      toast.info("Cart is already empty.");
      return;
    }
    replace([]);
    reset(buildDefaultValues());
    setCustomerLabel("");
    resetPayment();
    toast.info("Cart cleared.");
  };

  usePageShortcuts([
    {
      id: "complete-sale",
      shortcut: "F11",
      description: "Complete Sale",
      priority: 300,
      execute: () => paymentRef.current?.complete(),
    },
    {
      id: "hold",
      shortcut: "F9",
      description: "Hold Invoice",
      priority: 300,
      execute: holdCurrentCart,
    },
    {
      id: "discount",
      shortcut: "F8",
      description: "Discount",
      priority: 300,
      execute: () => summaryRef.current?.openDiscountEditor(),
    },
    {
      id: "tax",
      shortcut: "F10",
      description: "Tax",
      priority: 300,
      execute: () => summaryRef.current?.openTaxEditor(),
    },
    {
      id: "recall",
      shortcut: "F12",
      description: "Recall Held",
      priority: 300,
      execute: handleOpenRecall,
    },
    {
      id: "focus-search",
      shortcut: "/",
      description: "Focus Product Search",
      priority: 300,
      execute: () => entryRowRef.current?.focus(),
    },
    {
      id: "clear-cart",
      shortcut: "Ctrl+Delete",
      description: "Clear Cart",
      priority: 300,
      execute: handleClear,
    },
  ]);

  return (
    <div className="flex flex-col min-h-[calc(100vh-64px)] bg-transparent">
      <div className="flex-1 max-w-7xl mx-auto w-full -mt-2 pb-6">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
          <div className="flex flex-col lg:col-span-3 min-h-0">
            <PosHeader
              register={register}
              customerId={customerId || null}
              customerLabel={customerLabel}
              onCustomerChange={(id, name) => {
                setValue("customerId", id ?? "", { shouldValidate: true });
                setCustomerLabel(name);
              }}
              customerError={errors.customerId?.message}
            />

            <StockError message={stockError} />

            <form
              onSubmit={handleSubmit(onSubmit)}
              className="flex flex-1 flex-col overflow-hidden"
            >
              <ItemsTable
                onAddItem={handleAddItem}
                fields={fields}
                control={control}
                setValue={setValue}
                onRemove={remove}
                errors={errors}
                entryRowRef={entryRowRef}
                heldCount={heldInvoices.length}
                onHold={holdCurrentCart}
                onRecallHeld={handleOpenRecall}
                onClear={handleClear}
              />
            </form>
          </div>

          <div className="lg:col-span-1 flex flex-col gap-4 h-full">
            <SaleSummary
              ref={summaryRef}
              itemsCount={items?.length ?? 0}
              totalQuantity={(items ?? []).reduce((sum, item) => {
                const ps = Number(item?.packingSize) || 1;
                return (
                  sum +
                  (Number(item?.packQuantity) || 0) * ps +
                  (Number(item?.looseQuantity) || 0)
                );
              }, 0)}
              grossAmount={totals.gross}
              discount={totals.discount}
              tax={totals.tax}
              netAmount={totals.net}
              discountPercent={discountPercent}
              taxPercent={taxPercent}
              onDiscountPercentChange={(v) => {
                setValue("discountPercent", v);
                setLastDiscountPercent(v);
              }}
              onTaxPercentChange={(v) => {
                setValue("taxPercent", v);
                setLastTaxPercent(v);
              }}
            />
            <div className="flex-1">
              <SalePayment
                ref={paymentRef}
                netAmount={totals.net}
                saleCompleted={!!completedSale}
                selectedPayment={selectedPayment}
                onPaymentChange={setSelectedPayment}
                onComplete={handleCompleteSale}
                onPrint={handlePrint}
                paymentError={paymentError}
              />
            </div>
          </div>
        </div>
      </div>

      {showRecallPopover && (
        <RecallHeldPopover
          heldInvoices={heldInvoices}
          onSelect={handleSelectHeld}
          onClose={() => setShowRecallPopover(false)}
        />
      )}

      {completedSale && (
        <SaleCompleteModal
          sale={completedSale}
          onPrint={handlePrint}
          onNewSale={handleNewSale}
        />
      )}
      {PinModalElement}
    </div>
  );
}
