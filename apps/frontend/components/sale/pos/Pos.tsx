"use client";

import { useState, useRef, useMemo } from "react";
import { useForm, useWatch, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { SaleType } from "@repo/shared";
import {
  saleFormSchema,
  SaleFormInput,
  SaleFormOutput,
  SaleItemValues,
} from "@/schemas/sale-form";
import { buildCreateSalePayload } from "./build-payload";
import { previewSaleNumber } from "@/constants/sale/sale-number-preview";
import { useCreateSale, useSales } from "@/hooks/useSale";
import { calculateSaleItemAmounts } from "@/lib/sale-calculations";
import {
  PosHeader,
  PosFooter,
  StockError,
  ItemsTable,
  SaleEntryRowRef,
} from ".";

export default function PosPage() {
  const router = useRouter();
  const createSale = useCreateSale();
  const { data: sales } = useSales();

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SaleFormInput, unknown, SaleFormOutput>({
    resolver: zodResolver(saleFormSchema),
    defaultValues: {
      type: SaleType.SALE,
      customerName: "Walk-in Customer",
      saleDate: new Date().toISOString().slice(0, 10),
      remarks: "",
      items: [],
    },
  });

  const { fields, insert, remove } = useFieldArray({ control, name: "items" });
  const items = useWatch({ control, name: "items" });

  const saleNoPreview = useMemo(
    () => previewSaleNumber(SaleType.SALE, sales),
    [sales],
  );
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [stockError, setStockError] = useState<string | null>(null);
  const entryRowRef = useRef<SaleEntryRowRef>(null);

  const handleAddItem = (item: SaleItemValues) => {
    insert(0, item);
    // Scroll to the new item with smooth animation
    setTimeout(() => {
      const newItem = document.querySelector(`[data-item-index="0"]`);
      if (newItem) {
        newItem.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 100);
  };

  const totals = useMemo(() => {
    return items.reduce(
      (acc, item) => {
        const a = calculateSaleItemAmounts({
          quantity: Number(item?.quantity) || 0,
          saleRate: Number(item?.saleRate) || 0,
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
  }, [items]);

  const onSubmit = async (data: SaleFormOutput) => {
    setStockError(null);
    const payload = buildCreateSalePayload(data);
    try {
      await createSale.mutateAsync(payload);
      router.push("/sale");
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

  const handleAddButtonClick = () => {
    if (entryRowRef.current) {
      entryRowRef.current.commit();
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50/50">
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 py-6 space-y-4">
        <PosHeader register={register} saleNoPreview={saleNoPreview} />

        <StockError message={stockError} />

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col flex-1 space-y-4"
        >
          <ItemsTable
            showAdvanced={showAdvanced}
            onToggleAdvanced={() => setShowAdvanced((v) => !v)}
            onAddItem={handleAddItem}
            fields={fields}
            control={control}
            register={register}
            onRemove={remove}
            errors={errors}
            entryRowRef={entryRowRef}
            handleAddButtonClick={handleAddButtonClick}
          />
        </form>
      </div>

      <PosFooter
        totals={totals}
        isSubmitting={isSubmitting}
        handleSubmit={handleSubmit}
        onSubmit={onSubmit}
      />
    </div>
  );
}
