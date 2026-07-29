"use client";

import { useState, useRef, useMemo, useEffect } from "react";
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
import { useHeldInvoices } from "@/hooks/useHeldInvoices";
import { SaleCompleteModal, CompletedSale } from ".";

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

  const { fields, insert, remove } = useFieldArray({ control, name: "items" });
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
      // Show the confirmation modal instead of navigating away — the
      // cashier needs to see the generated saleNumber and confirm the
      // bill before moving on, and staying on this screen keeps the next
      // walk-in customer's checkout just one "New sale" click away.
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

  // SalePayment hands back a plain (paidAmount: number) call — used only to
  // sanity-check the cashier hasn't accepted less cash than the net amount.
  // paidAmount itself is never persisted; it's purely for computing change.
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
    reset();
    // Ready immediately for the next customer.
    requestAnimationFrame(() => entryRowRef.current?.focus());
  };

  const handlePrint = () => {
    // TODO: wire real print/receipt logic once print format is decided.
    console.log("Print", completedSale);
  };

  const { heldInvoices, hold, recall } = useHeldInvoices();

  const handleHold = () => {
    if (!items || items.length === 0) return;
    hold({
      customerName: customerName ?? "Walk-in Customer",
      items: (items ?? []) as SaleFormInput["items"],
    });
    reset();
  };

  const handleRecallHeld = () => {
    // Placeholder: recalls the most recently held cart.
    // Swap for a picker modal once there's a proper "Recall held" list UI.
    const last = heldInvoices[heldInvoices.length - 1];
    if (last) {
      const recalled = recall(last.id);
      if (recalled) {
        reset({ items: recalled.items });
      }
    }
  };

  const handleClear = () => {
    reset();
  };
  
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Don't fire shortcuts while the completion modal is up — only
      // Enter/Escape should matter there, and we're not wiring those yet.
      if (completedSale) return;

      const target = e.target as HTMLElement;
      const isTyping =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable;

      switch (e.key) {
        case "F5":
          e.preventDefault();
          paymentRef.current?.complete();
          break;
        case "F6":
          e.preventDefault();
          handleHold();
          break;
        case "F8":
          e.preventDefault();
          summaryRef.current?.openDiscountEditor();
          break;
        case "F9":
          e.preventDefault();
          handleRecallHeld();
          break;
        case "F10":
          e.preventDefault();
          summaryRef.current?.openTaxEditor();
          break;
        case "Delete":
          if (e.ctrlKey) {
            e.preventDefault();
            handleClear();
          }
          break;
        case "/":
          if (!isTyping) {
            e.preventDefault();
            entryRowRef.current?.focus();
          }
          break;
        default:
          break;
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

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
                onHold={handleHold}
                onRecallHeld={handleRecallHeld}
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
