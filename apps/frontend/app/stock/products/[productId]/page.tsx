"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useState, useMemo } from "react";
import { useProductStock } from "@/hooks/useStock";
import { useProduct } from "@/hooks/useProducts";
import {
  ArrowLeft,
  Package,
  AlertCircle,
  CheckCircle,
  Clock,
  Loader2,
  Hash,
  Box,
  AlertTriangle,
  BadgeCent,
} from "lucide-react";

export default function ProductStockPage() {
  const { productId } = useParams<{ productId: string }>();
  const { data: product, isLoading: productLoading } = useProduct(productId);
  const { data: stockData, isLoading: stockLoading } =
    useProductStock(productId);

  // Lazy initializer - runs only once
  const [now] = useState(() => Date.now());

  const isLoading = productLoading || stockLoading;

  // Check expiry status
  const getExpiryStatus = (expiryDate?: string | null) => {
    if (!expiryDate)
      return { status: "none", label: "No expiry", color: "text-slate-400" };

    const days = (new Date(expiryDate).getTime() - now) / (1000 * 60 * 60 * 24);

    if (days < 0) {
      return {
        status: "expired",
        label: "Expired",
        color: "text-rose-600 bg-rose-50",
      };
    } else if (days < 30) {
      return {
        status: "critical",
        label: "Expiring soon",
        color: "text-orange-600 bg-orange-50",
      };
    } else if (days < 90) {
      return {
        status: "warning",
        label: "Near expiry",
        color: "text-amber-600 bg-amber-50",
      };
    } else {
      return {
        status: "good",
        label: "Good",
        color: "text-emerald-600 bg-emerald-50",
      };
    }
  };

  // Summary stats
  const stats = useMemo(() => {
    if (!stockData) return null;

    const totalValue = stockData.batches.reduce(
      (sum, b) => sum + b.currentQuantity * b.purchaseRate,
      0,
    );

    const nearExpiryCount = stockData.batches.filter(
      (b) =>
        b.expiryDate &&
        new Date(b.expiryDate).getTime() - now < 90 * 24 * 60 * 60 * 1000,
    ).length;

    const expiredCount = stockData.batches.filter(
      (b) => b.expiryDate && new Date(b.expiryDate).getTime() - now < 0,
    ).length;

    return {
      totalValue,
      nearExpiryCount,
      expiredCount,
      batchCount: stockData.batches.length,
    };
  }, [stockData, now]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50/50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-slate-400 animate-spin mx-auto" />
          <p className="text-sm text-slate-500 mt-3">
            Loading product stock...
          </p>
        </div>
      </div>
    );
  }

  if (!product || !stockData) {
    return (
      <div className="min-h-screen bg-slate-50/50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-lg font-semibold text-slate-800 mt-3">
            Product Not Found
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            The product you&apos;re looking for doesn&apos;t exist.
          </p>
          <Link
            href="/stock"
            className="inline-flex items-center gap-2 mt-4 text-sm font-medium text-slate-900 hover:text-slate-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Stock Overview
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 py-6">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/stock"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Stock Overview
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                  <Package className="w-5 h-5 text-slate-700" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                    {product.name}
                  </h1>
                  <p className="text-sm text-slate-500 mt-0.5">
                    Product ID: {productId}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-white px-4 py-3 rounded-xl border border-slate-200 shadow-sm">
              <div className="text-right">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Total Stock
                </p>
                <p className="text-2xl font-bold text-slate-900">
                  {stockData.totalQuantity}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Batches
                  </p>
                  <p className="text-lg font-bold text-slate-900 mt-0.5">
                    {stats.batchCount}
                  </p>
                </div>
                <div className="p-2 bg-slate-50 rounded-lg">
                  <Box className="w-4 h-4 text-slate-500" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Total Value
                  </p>
                  <p className="text-lg font-bold text-slate-900 mt-0.5">
                    PKR {stats.totalValue.toFixed(2)}/-
                  </p>
                </div>
                <div className="p-2 bg-slate-50 rounded-lg">
                  <BadgeCent className="w-4 h-4 text-slate-500" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Near Expiry
                  </p>
                  <p
                    className={`text-lg font-bold mt-0.5 ${stats.nearExpiryCount > 0 ? "text-amber-600" : "text-slate-900"}`}
                  >
                    {stats.nearExpiryCount}
                  </p>
                </div>
                <div className="p-2 bg-amber-50 rounded-lg">
                  <Clock className="w-4 h-4 text-amber-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Expired
                  </p>
                  <p
                    className={`text-lg font-bold mt-0.5 ${stats.expiredCount > 0 ? "text-rose-600" : "text-slate-900"}`}
                  >
                    {stats.expiredCount}
                  </p>
                </div>
                <div className="p-2 bg-rose-50 rounded-lg">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Batches Table */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Hash className="w-4 h-4 text-slate-500" />
                <h2 className="font-semibold text-slate-700 text-sm">
                  Batches
                </h2>
                <span className="text-xs text-slate-400 bg-white px-2.5 py-0.5 rounded-full border border-slate-200">
                  {stockData.batches.length}
                </span>
              </div>
            </div>
          </div>

          {stockData.batches.length === 0 ? (
            <div className="p-12 text-center">
              <Box className="w-12 h-12 text-slate-300 mx-auto" />
              <p className="text-sm text-slate-500 mt-2">
                No batches found for this product
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/30">
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Batch #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Expiry
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Purchase Rate
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Sale Rate
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Value
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stockData.batches.map((batch) => {
                    const expiryStatus = getExpiryStatus(batch.expiryDate);
                    const isExpired = expiryStatus.status === "expired";
                    const isNearExpiry =
                      expiryStatus.status === "warning" ||
                      expiryStatus.status === "critical";

                    return (
                      <tr
                        key={batch.batchId}
                        className={`transition-colors ${
                          isExpired
                            ? "bg-rose-50/50 hover:bg-rose-50"
                            : isNearExpiry
                              ? "bg-amber-50/30 hover:bg-amber-50"
                              : "hover:bg-slate-50/70"
                        }`}
                      >
                        <td className="px-6 py-3.5">
                          <span className="text-sm font-medium text-slate-900">
                            {batch.batchNumber}
                          </span>
                        </td>
                        <td className="px-6 py-3.5 text-sm text-slate-600">
                          {batch.expiryDate ? (
                            new Date(batch.expiryDate).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              },
                            )
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-6 py-3.5">
                          {batch.expiryDate ? (
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${expiryStatus.color}`}
                            >
                              {expiryStatus.status === "expired" && (
                                <AlertCircle className="w-3 h-3" />
                              )}
                              {expiryStatus.status === "critical" && (
                                <AlertTriangle className="w-3 h-3" />
                              )}
                              {expiryStatus.status === "warning" && (
                                <Clock className="w-3 h-3" />
                              )}
                              {expiryStatus.status === "good" && (
                                <CheckCircle className="w-3 h-3" />
                              )}
                              {expiryStatus.label}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400">
                              No expiry
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-3.5 text-sm font-semibold text-slate-900 text-right">
                          {batch.currentQuantity}
                        </td>
                        <td className="px-6 py-3.5 text-sm text-slate-600 text-right">
                          PKR {batch.purchaseRate.toFixed(2)}/-
                        </td>
                        <td className="px-6 py-3.5 text-sm text-slate-600 text-right">
                          PKR {batch.saleRate.toFixed(2)}/-
                        </td>
                        <td className="px-6 py-3.5 text-sm font-semibold text-slate-900 text-right">
                          PKR 
                          {(batch.currentQuantity * batch.purchaseRate).toFixed(
                            2,
                          )}/-
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
