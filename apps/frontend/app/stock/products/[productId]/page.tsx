"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useProductStock } from "../../../../hooks/useStock";

export default function ProductStockPage() {
  const { productId } = useParams<{ productId: string }>();
  const { data, isLoading } = useProductStock(productId);

  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
  }, []);

  if (isLoading) return <div className="p-6">Loading...</div>;
  if (!data) return <div className="p-6">No stock data.</div>;

  const isNearExpiry = (expiry: string | null, now: number | null) => {
    if (!expiry || now === null) return false;
    const days = (new Date(expiry).getTime() - now) / (1000 * 60 * 60 * 24);
    return days < 90;
  };

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-1">Product Stock</h1>
      <p className="text-sm text-gray-600 mb-4">
        Total Quantity: {data.totalQuantity}
      </p>

      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="text-left border-b bg-gray-50">
            <th className="p-2">Batch #</th>
            <th className="p-2">Expiry</th>
            <th className="p-2 text-right">Qty</th>
            <th className="p-2 text-right">P.Rate</th>
            <th className="p-2 text-right">S.Rate</th>
          </tr>
        </thead>
        <tbody>
          {data.batches.map((b) => (
            <tr
              key={b.batchId}
              className={`border-b ${(b.expiryDate ? isNearExpiry(b.expiryDate, now) : false) ? "bg-red-50" : ""}`}
            >
              <td className="p-2">{b.batchNumber}</td>
              <td className="p-2">
                {b.expiryDate
                  ? new Date(b.expiryDate).toLocaleDateString()
                  : "-"}
              </td>
              <td className="p-2 text-right">{b.currentQuantity}</td>
              <td className="p-2 text-right">{b.purchaseRate.toFixed(2)}</td>
              <td className="p-2 text-right">{b.saleRate.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
