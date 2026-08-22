"use client";

import { UseFormRegister, FieldErrors } from "react-hook-form";
import { StockVoucherType } from "@repo/shared";
import { StockVoucherFormInput } from "@/schemas/stock-voucher";
import {
  VOUCHER_TYPE_LABELS,
  IMPLEMENTED_VOUCHER_TYPES,
} from "@/constants/stock/stock-voucher";
import { AsyncSelect } from "@/components/ui/async-select";
import { useDistributorsOptions } from "@/hooks/useDistributors";
import Card from "@/components/ui/card";
import Input from "@/components/ui/input";
import Select from "@/components/ui/select";
import { AlertCircle } from "lucide-react";

interface Props {
  register: UseFormRegister<StockVoucherFormInput>;
  errors: FieldErrors<StockVoucherFormInput>;
  type: StockVoucherType;
  supplierId: string | null | undefined;
  distributorLabel: string;
  onDistributorChange: (id: string | null, label: string) => void;
}

const voucherTypeOptions = Object.entries(VOUCHER_TYPE_LABELS).map(
  ([value, label]) => ({ value, label }),
);

export function VoucherHeaderCard({
  register,
  errors,
  type,
  supplierId,
  distributorLabel,
  onDistributorChange,
}: Props) {
  return (
    <Card className="flex flex-wrap items-center gap-4">
      <div className="min-w-[150px]">
        <Select
          label="Type"
          options={voucherTypeOptions}
          {...register("type")}
          error={errors.type?.message}
        />
        {!IMPLEMENTED_VOUCHER_TYPES.has(type) && (
          <div className="flex items-center gap-1 mt-1 text-amber-600">
            <AlertCircle className="w-3 h-3" />
            <p className="text-xs">Not implemented yet</p>
          </div>
        )}
      </div>

      <div className="min-w-[200px] flex-1 relative">
        <AsyncSelect
          label={
            type === StockVoucherType.PURCHASE ? "Distributor *" : "Distributor"
          }
          placeholder="Search distributor..."
          value={supplierId ?? null}
          selectedLabel={distributorLabel}
          useOptions={useDistributorsOptions}
          onChange={(id, option) => {
            onDistributorChange(id ?? null, option?.name ?? "");
          }}
          error={errors.supplierId?.message}
        />
      </div>

      <div className="min-w-[160px]">
        <Input
          type="date"
          label="Date"
          {...register("voucherDate")}
          error={errors.voucherDate?.message}
        />
      </div>

      <div className="flex-1 min-w-[160px]">
        <Input
          {...register("remarks")}
          label="Remarks"
          placeholder="Optional"
          error={errors.remarks?.message}
        />
      </div>
    </Card>
  );
}
