"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useStockVoucherForm } from "@/components/features/stock/stockEntry/useStockVoucherForm";
import { VoucherHeaderCard } from "@/components/features/stock/stockEntry/VoucherHeaderCard";
import { VoucherItemsTable } from "@/components/features/stock/stockEntry/VoucherItemsTable";
import { VoucherTotalsBar } from "@/components/features/stock/stockEntry/VoucherTotalsBar";
import { VoucherActionsRow } from "@/components/features/stock/stockEntry/VoucherActionsRow";

export default function NewStockVoucherPage() {
  const {
    register,
    control,
    handleSubmit,
    setValue,
    errors,
    isSubmitting,
    fields,
    remove,
    type,
    supplierId,
    supplierLabel,
    setSupplierTouched,
    setSupplierLabel,
    entryRowRef,
    productNames,
    setEntryProductId,
    handleAddItem,
    handleEditItem,
    handleAddButtonClick,
    totals,
    selectedPayment,
    setSelectedPayment,
    onSubmit,
  } = useStockVoucherForm();

  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <div className="flex flex-col min-h-full">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col flex-1 gap-4"
      >
        <Link
          href="/stock"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Vouchers
        </Link>

        <VoucherHeaderCard
          register={register}
          errors={errors}
          type={type}
          supplierId={supplierId}
          supplierLabel={supplierLabel}
          onSupplierChange={(id, label) => {
            setSupplierTouched(true);
            setValue("supplierId", id ?? "", { shouldValidate: true });
            setSupplierLabel(label);
          }}
        />

        <VoucherItemsTable
          fields={fields}
          control={control}
          register={register}
          errors={errors}
          showAdvanced={showAdvanced}
          onToggleAdvanced={() => setShowAdvanced((v) => !v)}
          entryRowRef={entryRowRef}
          productNames={productNames}
          onAdd={handleAddItem}
          onEdit={handleEditItem}
          onRemove={remove}
          onProductPicked={setEntryProductId}
          onAddButtonClick={handleAddButtonClick}
        />

        <VoucherActionsRow />

        <div className="h-20 shrink-0" aria-hidden />
      </form>

      <VoucherTotalsBar
        totals={totals}
        onSave={handleSubmit(onSubmit)}
        isSubmitting={isSubmitting}
        selectedPayment={selectedPayment}
        onPaymentChange={setSelectedPayment}
      />
    </div>
  );
}
