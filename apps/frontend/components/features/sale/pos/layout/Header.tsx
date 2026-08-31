"use client";

import { UseFormRegister } from "react-hook-form";
import { SaleFormInput } from "@/schemas/sale-form";
import { AsyncSelect } from "@/components/ui/async-select";
import { useCustomersOptions } from "@/hooks/useBusinessContacts";

interface PosHeaderProps {
  register: UseFormRegister<SaleFormInput>;
  customerId: string | null;
  customerLabel: string;
  onCustomerChange: (id: string | null, name: string) => void;
  customerError?: string;
}

export function PosHeader({
  register,
  customerId,
  customerLabel,
  onCustomerChange,
  customerError,
}: PosHeaderProps) {
  return (
    <div className="border-b border-gray-100/80 py-2">
      <div className="grid grid-cols-12 items-end gap-2">
        {/* Customer */}
        <div className="col-span-4">
          <label className="block pb-0.5 text-[10px] font-medium uppercase tracking-wider text-gray-400/80">
            Customer
          </label>
          <AsyncSelect
            placeholder="Search customer..."
            value={customerId}
            selectedLabel={customerLabel}
            useOptions={useCustomersOptions}
            onChange={(id, option) => onCustomerChange(id, option?.name ?? "")}
            error={customerError}
            minChars={2}
            triggerClassName="h-9 py-0 px-3 rounded-md"
          />
        </div>

        {/* Date */}
        <div className="col-span-4">
          <label className="block pb-0.5 text-[10px] font-medium uppercase tracking-wider text-gray-400/80">
            Date
          </label>
          <input
            type="date"
            {...register("saleDate")}
            className="h-9 w-full rounded-md border border-gray-300 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
          />
        </div>

        {/* Remarks */}
        <div className="col-span-4">
          <label className="block pb-0.5 text-[10px] font-medium uppercase tracking-wider text-gray-400/80">
            Remarks
          </label>
          <input
            {...register("remarks")}
            placeholder="Optional"
            className="h-9 w-full rounded-md border border-gray-300 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
          />
        </div>
      </div>
    </div>
  );
}
