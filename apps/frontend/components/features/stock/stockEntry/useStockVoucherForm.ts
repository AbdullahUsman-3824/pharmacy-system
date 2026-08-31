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
import { usePinModal } from "@/hooks/usePinModal";
import { useCreateStockVoucher } from "@/hooks/useStock";
import { calculateItemAmounts } from "@/lib/stock-calculations";
import { buildCreateVoucherPayload } from "@/components/features/stock/stockEntry/build-payload";
import { StockVoucherEntryRowRef } from "./VoucherEntryRow";
import { PaymentOption } from "@/components/shared/payment-select";
import { toast } from "sonner";

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

  const entryRowRef = useRef<StockVoucherEntryRowRef>(null);

  const [supplierTouched, setSupplierTouched] = useState(false);
  const [entryProductId, setEntryProductId] = useState("");
  const [productNames, setProductNames] = useState<Record<string, string>>({});
  const [supplierLabel, setSupplierLabel] = useState<string>("");

  function handleAddItem(item: StockVoucherItemValues, productName: string) {
    insert(0, item);
    if (productName) {
      setProductNames((prev) => ({ ...prev, [item.productId]: productName }));
    }
    toast.success(`${productName || "Item"} added successfully!`);
  }

  function handleEditItem(item: StockVoucherItemValues) {
    entryRowRef.current?.setData(item, productNames[item.productId]);
  }

  function handleAddButtonClick() {
    entryRowRef.current?.commit();
  }

  const totals: VoucherTotals = (items ?? []).reduce(
    (acc, item) => {
      const a = calculateItemAmounts({
        packQuantity: Number(item?.packQuantity) || 0,
        looseQuantity: Number(item?.looseQuantity) || 0,
        purchaseRate: Number(item?.purchaseRate) || 0,
        packingSize: Number(item?.packingSize) || 1,
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

  const { getPin, PinModalElement } = usePinModal();

  const onSubmit = async (data: StockVoucherFormOutput) => {
    // Validate supplier
    if (!data.supplierId) {
      toast.error("Please select a supplier.");
      return;
    }

    // Validate items
    if (!data.items || data.items.length === 0) {
      toast.error("Please add at least one item to the voucher.");
      return;
    }

    const confirmedBatchKeys = new Set<string>();

    const trySubmit = async (): Promise<void> => {
      try {
        const pin = await getPin("salesman");
        if (!pin) {
          toast.error("PIN verification cancelled or failed.");
          return;
        }

        const payload = buildCreateVoucherPayload(
          data,
          confirmedBatchKeys,
          pin,
        );
        await createVoucher.mutateAsync(payload);
        toast.success("Stock voucher created successfully!");
        router.push("/stock");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        // Handle the error from apiClient interceptor
        const errorMessage =
          error?.message || "Failed to create stock voucher. Please try again.";

        // Check if it's a batch rate mismatch error
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
          } else {
            toast.info("Batch update cancelled.");
            return;
          }
        }

        // Check for PIN errors
        if (
          errorMessage.toLowerCase().includes("pin") ||
          errorMessage.toLowerCase().includes("incorrect pin")
        ) {
          toast.error("Incorrect PIN. Please try again.");
          return;
        }

        // Check for stock-related errors
        if (
          errorMessage.toLowerCase().includes("stock") ||
          errorMessage.toLowerCase().includes("inventory")
        ) {
          toast.error(`Stock error: ${errorMessage}`);
          return;
        }

        // Handle all other errors
        toast.error(errorMessage);
        console.error("Stock voucher creation error:", error);
      }
    };

    try {
      await trySubmit();
    } catch (error) {
      // This catches any unhandled errors from trySubmit
      const errorMessage =
        error instanceof Error
          ? error.message
          : "An unexpected error occurred.";
      toast.error(errorMessage);
      console.error("Unhandled error in onSubmit:", error);
    }
  };

  return {
    register,
    control,
    handleSubmit,
    setValue,
    errors,
    isSubmitting,

    fields,
    remove,

    type,
    items,
    supplierId,

    supplierTouched,
    setSupplierTouched,
    supplierLabel,
    setSupplierLabel,

    entryProductId,
    setEntryProductId,

    productNames,

    entryRowRef,

    handleAddItem,
    handleEditItem,
    handleAddButtonClick,

    totals,

    selectedPayment,
    setSelectedPayment,

    PinModalElement,
    onSubmit,
  };
}
