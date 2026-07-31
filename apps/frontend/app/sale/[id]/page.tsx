"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useSaleDetail } from "@/hooks/useSale";
import { SaleType } from "@repo/shared";
import { formatCurrency, formatDate } from "@/lib/format";

export default function SaleDetailPage() {
  const params = useParams<{ id: string }>();
  const { data: sale, isLoading, isError } = useSaleDetail(params.id);

  if (isLoading) {
    return <div className="max-w-4xl mx-auto py-10 text-center">Loading…</div>;
  }

  if (isError || !sale) {
    return (
      <div className="max-w-4xl mx-auto py-10 text-center text-red-600">
        Sale not found.
      </div>
    );
  }

  const isReturn = sale.type === SaleType.SALE_RETURN;

  return (
    <div className="max-w-4xl mx-auto w-full py-6 px-4">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold">
            {isReturn ? "Sale Return" : "Sale"} — {sale.saleNumber}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {formatDate(sale.date)} · {sale.customerName}
          </p>
          {isReturn && sale.originalSaleId && (
            <Link
              href={`/sale/${sale.originalSaleId}`}
              className="text-sm text-blue-600 hover:underline mt-1 inline-block"
            >
              View original sale
            </Link>
          )}
        </div>

        {!isReturn && (
          <Link
            href={`/sale/return?saleId=${encodeURIComponent(sale.id)}`}
            className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50 whitespace-nowrap"
          >
            Return items
          </Link>
        )}
      </div>

      <div className="rounded-lg border overflow-hidden mb-6">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-600">
            <tr>
              <th className="px-4 py-2 font-medium">Product</th>
              <th className="px-4 py-2 font-medium">Batch</th>
              <th className="px-4 py-2 font-medium text-right">Packs</th>
              <th className="px-4 py-2 font-medium text-right">Loose</th>
              <th className="px-4 py-2 font-medium text-right">Rate</th>
              <th className="px-4 py-2 font-medium text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {sale.items.map((item) => (
              <tr key={item.id}>
                <td className="px-4 py-2">{item.productName ?? "—"}</td>
                <td className="px-4 py-2 font-mono text-xs">
                  {item.batch.batchNumber}
                </td>
                <td className="px-4 py-2 text-right">{item.packQuantity}</td>
                <td className="px-4 py-2 text-right">{item.looseQuantity}</td>
                <td className="px-4 py-2 text-right">
                  {formatCurrency(item.saleRate)}
                </td>
                <td className="px-4 py-2 text-right">
                  {formatCurrency(item.netAmount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-lg border p-4 ml-auto max-w-xs text-sm space-y-1">
        <div className="flex justify-between">
          <span className="text-gray-500">Gross</span>
          <span>{formatCurrency(sale.grossAmount)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">
            Discount {sale.discountPercent ? `(${sale.discountPercent}%)` : ""}
          </span>
          <span>-{formatCurrency(sale.discountAmount)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">
            Tax {sale.taxPercent ? `(${sale.taxPercent}%)` : ""}
          </span>
          <span>{formatCurrency(sale.taxAmount)}</span>
        </div>
        <div className="flex justify-between font-semibold border-t pt-1 mt-1">
          <span>Net</span>
          <span>{formatCurrency(sale.netAmount)}</span>
        </div>
      </div>

      {sale.remarks && (
        <p className="text-sm text-gray-500 mt-4">Remarks: {sale.remarks}</p>
      )}
    </div>
  );
}