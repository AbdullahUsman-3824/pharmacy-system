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
import {
  PosHeader,
  PosFooter,
  StockError,
  ItemsTable,
  SaleEntryRowRef,
} from ".";

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export default function PosPage() {
  const router = useRouter();
  const createSale = useCreateSale();
  const { data: sales } = useSales();

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
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

  const saleNoPreview = useMemo(
    () => previewSaleNumber(SaleType.SALE, sales),
    [sales],
  );
  const [stockError, setStockError] = useState<string | null>(null);
  const entryRowRef = useRef<SaleEntryRowRef>(null);

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
    <div className="flex flex-col min-h-screen bg-transparent">
      <div className="flex-1 max-w-7xl mx-auto w-full  pb-6 space-y-4">
        <PosHeader register={register} saleNoPreview={saleNoPreview} />

        <StockError message={stockError} />

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col flex-1 space-y-4"
        >
          <ItemsTable
            onAddItem={handleAddItem}
            fields={fields}
            control={control}
            setValue={setValue}
            onRemove={remove}
            errors={errors}
            entryRowRef={entryRowRef}
            handleAddButtonClick={handleAddButtonClick}
          />
        </form>
      </div>

      <PosFooter
        totals={totals}
        discountPercent={discountPercent}
        taxPercent={taxPercent}
        onDiscountPercentChange={(v) => setValue("discountPercent", v)}
        onTaxPercentChange={(v) => setValue("taxPercent", v)}
        isSubmitting={isSubmitting}
        handleSubmit={handleSubmit}
        onSubmit={onSubmit}
      />
    </div>
  );
}
