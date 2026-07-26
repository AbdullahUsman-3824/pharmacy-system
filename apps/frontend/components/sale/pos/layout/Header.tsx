"use client";

import { UseFormRegister } from "react-hook-form";
import { SaleFormInput } from "@/schemas/sale-form";

interface PosHeaderProps {
  register: UseFormRegister<SaleFormInput>;
  saleNoPreview: string;
}

export function PosHeader({ register, saleNoPreview }: PosHeaderProps) {
  return (
    <div className="border-b border-gray-100/80 px-3 py-1.5">
      <div className="grid grid-cols-12 items-end gap-1.5">
        {/* Customer */}
        <div className="col-span-4">
          <label className="block text-[10px] font-medium uppercase tracking-wider text-gray-400/80">
            Customer
          </label>
          <input
            {...register("customerName")}
            placeholder="Walk-in Customer"
            className="h-9 w-full rounded-md border border-gray-300 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        {/* Date */}
        <div className="col-span-2">
          <label className="block text-[10px] font-medium uppercase tracking-wider text-gray-400/80">
            Date
          </label>
          <input
            type="date"
            {...register("saleDate")}
            className="h-9 w-full rounded-md border border-gray-300 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        {/* Remarks */}
        <div className="col-span-3">
          <label className="block text-[10px] font-medium uppercase tracking-wider text-gray-400/80">
            Remarks
          </label>
          <input
            {...register("remarks")}
            placeholder="Optional"
            className="h-9 w-full rounded-md border border-gray-300 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        {/* Invoice */}
        <div className="col-span-3 text-right">
          <label className="block text-[10px] font-medium uppercase tracking-wider text-gray-400/80">
            Invoice #
          </label>
          <div className="mt-0.5 font-mono text-sm text-gray-400">
            Auto-generated: <span className="font-bold text-gray-700">{saleNoPreview}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
