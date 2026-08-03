"use client";

import { useState, useRef, useMemo } from "react";
import { useForm, useWatch, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { SaleType } from "@repo/shared";
import {
  saleFormSchema,
  SaleFormInput,
  SaleFormOutput,
  SaleItemValues,
} from "@/schemas/sale-form";
import { buildCreateSalePayload } from "./build-payload";
import { useCreateSale } from "@/hooks/useSale";
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
import { RecallHeldPopover, SaleCompleteModal, CompletedSale } from ".";
import { usePageShortcuts } from "@/lib/shortcuts/usePageShortcuts";

function round2(value: number): number {
  return Math.round(value * 100) / 100;
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
    defaultValues: {
      type: SaleType.SALE,
      customerName: "Walk-in Customer",
      saleDate: new Date().toISOString().slice(0, 10),
      remarks: "",
      discountPercent: 0,
      taxPercent: 0,
      items: [],
    },
  });

  // `replace` is used any time the whole items array needs swapping out
  // (recall, clear) instead of reset({ items }) — reset() alone left
  // useFieldArray's internal keyed state out of sync with the form's real
  // values once handleAddItem's insert() ran afterward, which is exactly
  // why recalled items were dropping out on a subsequent hold.
  const { fields, insert, remove, replace } = useFieldArray({
    control,
    name: "items",
  });
  const items = useWatch({ control, name: "items" });
  const discountPercent = (useWatch({ control, name: "discountPercent" }) ??
    0) as number;
  const taxPercent = (useWatch({ control, name: "taxPercent" }) ?? 0) as number;
  const customerName = useWatch({ control, name: "customerName" });

  const [stockError, setStockError] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [completedSale, setCompletedSale] = useState<CompletedSale | null>(
    null,
  );
  const [showRecallPopover, setShowRecallPopover] = useState(false);

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
      const packPart =
        (Number(item?.packQuantity) || 0) * (Number(item?.saleRate) || 0);
      const loosePart =
        (Number(item?.looseQuantity) || 0) * (Number(item?.looseRate) || 0);
      return sum + packPart + loosePart;
    }, 0);
    const discount = round2(gross * (Number(discountPercent) / 100));
    const taxable = gross - discount;
    const tax = round2(taxable * (Number(taxPercent) / 100));
    const net = round2(taxable + tax);
    return { gross, discount, tax, net };
  }, [items, discountPercent, taxPercent]);

  const onSubmit = async (data: SaleFormOutput) => {
    setStockError(null);
    const payload = buildCreateSalePayload(data);
    try {
      const result = await createSale.mutateAsync(payload);
      setCompletedSale(result as unknown as CompletedSale);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      const responseData = error?.response?.data;
      if (responseData?.code === "INSUFFICIENT_STOCK") {
        setStockError(
          `Not enough stock available. Available: ${responseData.available}, requested: ${responseData.requested}.`,
        );
        return;
      }
      throw error;
    }
  };

  const handleCompleteSale = (paidAmount: number) => {
    if (paidAmount < totals.net) {
      setPaymentError("Amount paid is less than the net amount.");
      return;
    }
    setPaymentError(null);
    handleSubmit(onSubmit)();
  };

  const handleNewSale = () => {
    setCompletedSale(null);
    replace([]);
    reset();
    requestAnimationFrame(() => entryRowRef.current?.focus());
  };

  const handlePrint = () => {
    // TODO: wire real print/receipt logic once print format is decided.
    console.log("Print", completedSale);
  };

  const { heldInvoices, hold, recall } = useHeldInvoices();

  // Snapshots the current cart into the held list. Used both for the
  // explicit F6/"Hold invoice" action and silently before switching to a
  // recalled cart, so nothing the cashier was working on is ever lost.
  const holdCurrentCart = () => {
    if (!items || items.length === 0) return;
    hold({
      customerName: customerName ?? "Walk-in Customer",
      items: items as SaleFormInput["items"],
      netAmount: totals.net,
    });
    replace([]);
    reset();
  };

  const handleOpenRecall = () => {
    setShowRecallPopover(true);
  };

  const handleSelectHeld = (id: string) => {
    // If the cashier already has items in progress for someone else,
    // auto-hold that cart first — silent, no confirm — before loading the
    // one they picked. Nothing typed so far is lost.
    if (items && items.length > 0) {
      holdCurrentCart();
    }
    const recalled = recall(id);
    if (recalled) {
      replace(recalled.items);
      setValue("customerName", recalled.customerName);
    }
    setShowRecallPopover(false);
  };

  const handleClear = () => {
    replace([]);
    reset();
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
            <PosHeader register={register} />

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
              totalQuantity={(items ?? []).reduce(
                (sum, item) =>
                  sum +
                  (Number(item?.packQuantity) || 0) +
                  (Number(item?.looseQuantity) || 0),
                0,
              )}
              grossAmount={totals.gross}
              discount={totals.discount}
              tax={totals.tax}
              netAmount={totals.net}
              discountPercent={discountPercent}
              taxPercent={taxPercent}
              onDiscountPercentChange={(v) => setValue("discountPercent", v)}
              onTaxPercentChange={(v) => setValue("taxPercent", v)}
            />
            <div className="flex-1">
              <SalePayment
                ref={paymentRef}
                netAmount={totals.net}
                saleCompleted={!!completedSale}
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
    </div>
  );
}
