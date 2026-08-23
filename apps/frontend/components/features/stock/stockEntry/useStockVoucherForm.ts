"use client";

import { useEffect, useRef, useState } from "react";
import { useForm, useWatch, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { StockVoucherType } from "@repo/shared";
import {
  stockVoucherFormSchema,
  StockVoucherFormInput,
  StockVoucherFormOutput,
  StockVoucherItemValues,
} from "@/schemas/stock-voucher";
import { useCreateStockVoucher } from "@/hooks/useStock";
import { calculateItemAmounts } from "@/lib/stock-calculations";
import { buildCreateVoucherPayload } from "@/components/features/stock/stockEntry/build-payload";
import { StockVoucherEntryRowRef } from "./VoucherEntryRow";
import { PaymentOption } from "@/components/shared/payment-select";

export interface VoucherTotals {
  gross: number;
  discount: number;
  tax: number;
  net: number;
}

export function useStockVoucherForm() {
  const router = useRouter();
  const createVoucher = useCreateStockVoucher();

  const [selectedPayment, setSelectedPayment] = useState<PaymentOption | null>(
    null,
  );

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<StockVoucherFormInput, unknown, StockVoucherFormOutput>({
    resolver: zodResolver(stockVoucherFormSchema),
    defaultValues: {
      type: StockVoucherType.PURCHASE,
      supplierId: "",
      voucherDate: new Date().toISOString().slice(0, 10),
      remarks: "",
      payments: [],
      items: [],
    },
  });

  const { fields, insert, remove } = useFieldArray({ control, name: "items" });

  const type = useWatch({ control, name: "type" });
  const items = useWatch({ control, name: "items" });
  const supplierId = useWatch({ control, name: "supplierId" });

  // Ref to the entry row for programmatic commit / setData
  const entryRowRef = useRef<StockVoucherEntryRowRef>(null);

  // Track whether the user has explicitly picked a supplier
  const [supplierTouched, setSupplierTouched] = useState(false);

  // productId of the item currently being typed in the entry row
  const [entryProductId, setEntryProductId] = useState("");

  // productId -> display name map, populated as items are committed
  const [productNames, setProductNames] = useState<Record<string, string>>({});

  // Label shown in the AsyncSelect for the currently selected supplier
  const [supplierLabel, setSupplierLabel] = useState<string>("");

  // ── Item handlers ──────────────────────────────────────────────────────────

  function handleAddItem(item: StockVoucherItemValues, productName: string) {
    insert(0, item);
    if (productName) {
      setProductNames((prev) => ({ ...prev, [item.productId]: productName }));
    }
  }

  function handleEditItem(item: StockVoucherItemValues) {
    entryRowRef.current?.setData(item, productNames[item.productId]);
  }

  function handleAddButtonClick() {
    entryRowRef.current?.commit();
  }

  // ── Totals ─────────────────────────────────────────────────────────────────

  const totals: VoucherTotals = (items ?? []).reduce(
    (acc, item) => {
      const a = calculateItemAmounts({
        quantity: Number(item?.quantity) || 0,
        purchaseRate: Number(item?.purchaseRate) || 0,
        discountPercent: Number(item?.discountPercent) || 0,
        taxPercent: Number(item?.taxPercent) || 0,
      });
      acc.gross += a.grossAmount;
      acc.discount += a.discountAmount;
      acc.tax += a.taxAmount;
      acc.net += a.netAmount;
      return acc;
    },
    { gross: 0, discount: 0, tax: 0, net: 0 },
  );

  useEffect(() => {
    if (selectedPayment) {
      setValue("payments", [
        { paymentAccountId: selectedPayment.id, amount: totals.net },
      ]);
    } else {
      setValue("payments", []);
    }
  }, [selectedPayment, totals.net, setValue]);

  // ── Submit ─────────────────────────────────────────────────────────────────

  const onSubmit = async (data: StockVoucherFormOutput) => {
    const confirmedBatchKeys = new Set<string>();

    const trySubmit = async (): Promise<void> => {
      const payload = buildCreateVoucherPayload(data, confirmedBatchKeys);
      try {
        await createVoucher.mutateAsync(payload);
        router.push("/stock");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        const responseData = error?.response?.data;

        if (responseData?.code === "BATCH_RATE_MISMATCH") {
          const confirmed = window.confirm(
            `Batch ${responseData.batchNumber} already exists at ` +
              `purchase rate ${responseData.existingPurchaseRate} / sale rate ${responseData.existingSaleRate}.\n\n` +
              `Update the batch to the new rate you entered?`,
          );

          if (confirmed) {
            const batchKey = `${responseData.productId}::${responseData.batchNumber}`;
            confirmedBatchKeys.add(batchKey);
            await trySubmit();
            return;
          }
        }

        throw error;
      }
    };

    await trySubmit();
  };

  return {
    // form primitives
    register,
    control,
    handleSubmit,
    setValue,
    errors,
    isSubmitting,

    // field array
    fields,
    remove,

    // watched values
    type,
    items,
    supplierId,

    // supplier state
    supplierTouched,
    setSupplierTouched,
    supplierLabel,
    setSupplierLabel,

    // entry product tracking
    entryProductId,
    setEntryProductId,

    // product names map
    productNames,

    // entry row ref
    entryRowRef,

    // handlers
    handleAddItem,
    handleEditItem,
    handleAddButtonClick,

    // computed
    totals,

    // payment
    selectedPayment,
    setSelectedPayment,

    // submit
    onSubmit,
  };
}
