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

    onSubmit,
  };
}
