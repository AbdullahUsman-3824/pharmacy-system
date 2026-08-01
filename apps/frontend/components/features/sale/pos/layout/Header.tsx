"use client";

import { UseFormRegister } from "react-hook-form";
import { SaleFormInput } from "@/schemas/sale-form";
import { SALE_TYPE_LABELS } from "@/constants/sale/sale-form";
import { SaleType } from "@repo/shared";

interface PosHeaderProps {
  register: UseFormRegister<SaleFormInput>;
}

export function PosHeader({ register }: PosHeaderProps) {
  return (
    <div className="border-b border-gray-100/80 py-2">
      <div className="grid grid-cols-12 items-end gap-2">
        {/* Customer */}
        <div className="col-span-4">
          <label className="block pb-0.5 text-[10px] font-medium uppercase tracking-wider text-gray-400/80">
            Customer
          </label>
          <input
            {...register("customerName")}
            placeholder="Walk-in Customer"
            className="h-9 w-full rounded-md border border-gray-300 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
          />
        </div>

        {/* Date */}
        <div className="col-span-2">
          <label className="block pb-0.5 text-[10px] font-medium uppercase tracking-wider text-gray-400/80">
            Date
          </label>
          <input
            type="date"
            {...register("saleDate")}
            className="h-9 w-full rounded-md border border-gray-300 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
          />
        </div>

        {/* Invoice Type */}
        <div className="col-span-3">
          <label className="block pb-0.5 text-[10px] font-medium uppercase tracking-wider text-gray-400/80">
            Invoice Type
          </label>
          <select
            {...register("type")}
            className="h-9 w-full rounded-md border border-gray-300 px-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
            defaultValue={SaleType.SALE}
          >
            {Object.entries(SALE_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {/* Remarks */}
        <div className="col-span-3">
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
