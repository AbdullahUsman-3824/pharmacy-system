"use client";

import Link from "next/link";
import { useStockVouchers } from "../../../hooks/useStock";
import { useSuppliers } from "../../../hooks/useSuppliers";

export default function StockVouchersPage() {
  const { data: vouchers, isLoading } = useStockVouchers();
  const { data: suppliers } = useSuppliers();

  const supplierMap = new Map((suppliers ?? []).map((s) => [s.id, s.name]));

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-semibold">Stock Vouchers</h1>
        <Link
          href="/stock/vouchers/new"
          className="bg-blue-800 text-white px-4 py-2 rounded"
        >
          + New Voucher
        </Link>
      </div>

      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="text-left border-b bg-gray-50">
              <th className="p-2">Voucher #</th>
              <th className="p-2">Type</th>
              <th className="p-2">Date</th>
              <th className="p-2">Supplier</th>
              <th className="p-2 text-right">Net Amount</th>
            </tr>
          </thead>
          <tbody>
            {vouchers?.map((v) => (
              <tr key={v.id} className="border-b hover:bg-gray-50">
                <td className="p-2">{v.voucherNumber}</td>
                <td className="p-2">{v.type}</td>
                <td className="p-2">
                  {new Date(v.voucherDate).toLocaleDateString()}
                </td>
                <td className="p-2">
                  {v.supplierId ? (supplierMap.get(v.supplierId) ?? "—") : "-"}
                </td>
                <td className="p-2 text-right">{v.netAmount.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
