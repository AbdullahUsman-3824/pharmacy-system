"use client";

import { UseFormRegister } from "react-hook-form";
import { SaleFormInput } from "@/schemas/sale-form";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface PosHeaderProps {
  register: UseFormRegister<SaleFormInput>;
  saleNoPreview: string;
}

export function PosHeader({ register, saleNoPreview }: PosHeaderProps) {
  return (
    <div className="flex flex-col gap-3">
      <Link
        href="/sale"
        className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors w-fit"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Sales
      </Link>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gray-600 uppercase tracking-wider">
            Customer Name
          </label>
          <input
            {...register("customerName")}
            placeholder="Walk-in Customer"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gray-600 uppercase tracking-wider">
            Date
          </label>
          <input
            type="date"
            {...register("saleDate")}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gray-600 uppercase tracking-wider">
            Remarks
          </label>
          <input
            {...register("remarks")}
            placeholder="Optional notes..."
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          />
        </div>

        <div className="space-y-1.5 flex flex-col justify-end">
          <div className="text-sm text-gray-500">
            <span className="font-mono bg-gray-100 px-2 py-1 rounded">
              {saleNoPreview}
            </span>
            <span className="text-xs text-gray-400 ml-2">(estimated)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
