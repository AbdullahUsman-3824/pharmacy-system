"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useMemo } from "react";
import { useStockVouchers } from "../../../hooks/useStock";
import { useSuppliers } from "../../../hooks/useSuppliers";
import { VoucherTypeBadge } from "../../../components/stock/shared/VoucherTypeBadge";
import type { StockVoucherType } from "@repo/shared";
import {
  Plus,
  Search,
  Loader2,
  FileText,
  Building2,
  ChevronLeft,
  ChevronRight,
  X,
  ArrowLeft,
} from "lucide-react";

export default function StockVouchersPage() {
  const router = useRouter();
  const { data: vouchers, isLoading } = useStockVouchers();
  const { data: suppliers } = useSuppliers();

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<StockVoucherType | "ALL">(
    "ALL",
  );
  const [dateRange, setDateRange] = useState<{ from: string; to: string }>({
    from: "",
    to: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Supplier map for lookups
  const supplierMap = useMemo(
    () => new Map((suppliers ?? []).map((s) => [s.id, s.name])),
    [suppliers],
  );

  // Filter vouchers
  const filteredVouchers = useMemo(() => {
    if (!vouchers) return [];

    return vouchers.filter((v) => {
      // Search filter
      const matchesSearch =
        searchQuery === "" ||
        v.voucherNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.remarks?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (v.supplierId &&
          supplierMap
            .get(v.supplierId)
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()));

      // Type filter
      const matchesType = selectedType === "ALL" || v.type === selectedType;

      // Date filter
      const matchesDate =
        (!dateRange.from || new Date(v.date) >= new Date(dateRange.from)) &&
        (!dateRange.to || new Date(v.date) <= new Date(dateRange.to));

      return matchesSearch && matchesType && matchesDate;
    });
  }, [vouchers, searchQuery, selectedType, dateRange, supplierMap]);

  // Pagination
  const totalPages = Math.ceil((filteredVouchers?.length || 0) / itemsPerPage);
  const paginatedVouchers = filteredVouchers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  // Reset page when filters change
  const handleFilterChange = () => {
    setCurrentPage(1);
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery("");
    setSelectedType("ALL");
    setDateRange({ from: "", to: "" });
    setCurrentPage(1);
  };

  const hasActiveFilters =
    searchQuery || selectedType !== "ALL" || dateRange.from || dateRange.to;

  return (
    <div className="min-h-screen bg-slate-50/50 py-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <Link
          href="/stock"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Vouchers
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-blue-900 tracking-tight">
              Stock Vouchers
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Manage and track all inventory transactions
            </p>
          </div>
          <Link
            href="/stock/vouchers/new"
            className="inline-flex items-center gap-2 bg-blue-900 text-white px-5 py-2.5 rounded-lg hover:bg-slate-800 transition-colors font-medium text-sm shadow-sm whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            New Voucher
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by voucher #, supplier, or remarks..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    handleFilterChange();
                  }}
                  className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-shadow"
                />
              </div>
            </div>

            {/* Type Filter */}
            <div className="w-full md:w-48">
              <select
                value={selectedType}
                onChange={(e) => {
                  setSelectedType(e.target.value as StockVoucherType | "ALL");
                  handleFilterChange();
                }}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-shadow bg-white"
              >
                <option value="ALL">All Types</option>
                <option value="OPENING">Opening</option>
                <option value="PURCHASE">Purchase</option>
                <option value="PURCHASE_RETURN">Purchase Return</option>
                <option value="STOCK_ADJUSTMENT">Stock Adjustment</option>
                <option value="STOCK_TRANSFER">Stock Transfer</option>
              </select>
            </div>

            {/* Date Range */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <input
                  type="date"
                  value={dateRange.from}
                  onChange={(e) => {
                    setDateRange({ ...dateRange, from: e.target.value });
                    handleFilterChange();
                  }}
                  className="w-30 p-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-shadow"
                />
              </div>
              <span className="text-slate-400 text-sm">to</span>
              <div className="relative">
                <input
                  type="date"
                  value={dateRange.to}
                  onChange={(e) => {
                    setDateRange({ ...dateRange, to: e.target.value });
                    handleFilterChange();
                  }}
                  className="w-30 p-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-shadow"
                />
              </div>
            </div>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="inline-flex items-center gap-1 px-3 py-2 text-sm text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors whitespace-nowrap"
              >
                <X className="w-4 h-4" />
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Results count */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-slate-500">
            Showing {paginatedVouchers.length} of {filteredVouchers.length}{" "}
            vouchers
          </p>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <Loader2 className="w-6 h-6 text-slate-400 animate-spin mx-auto" />
            <p className="text-sm text-slate-500 mt-2">Loading vouchers...</p>
          </div>
        ) : filteredVouchers.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <FileText className="w-12 h-12 text-slate-300 mx-auto" />
            <p className="text-sm text-slate-500 mt-2">
              {hasActiveFilters
                ? "No vouchers match your filters"
                : "No vouchers created yet"}
            </p>
            {hasActiveFilters ? (
              <button
                onClick={clearFilters}
                className="text-sm font-medium text-slate-900 hover:text-slate-700 mt-1 transition-colors"
              >
                Clear filters
              </button>
            ) : (
              <Link
                href="/stock/vouchers/new"
                className="inline-flex items-center gap-1 text-sm font-medium text-slate-900 hover:text-slate-700 mt-1 transition-colors"
              >
                Create your first voucher
                <Plus className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/30">
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Voucher #
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Supplier
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Net Amount
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedVouchers.map((voucher) => (
                      <tr
                        key={voucher.id}
                        className="hover:bg-slate-50/70 transition-colors group cursor-pointer"
                        onClick={() =>
                          router.push(`/stock/vouchers/${voucher.id}`)
                        }
                      >
                        <td className="px-6 py-3.5">
                          <span className="text-sm font-medium text-slate-900">
                            #{voucher.voucherNumber}
                          </span>
                        </td>
                        <td className="px-6 py-3.5">
                          <VoucherTypeBadge type={voucher.type} />
                        </td>
                        <td className="px-6 py-3.5 text-sm text-slate-600">
                          {new Date(voucher.date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </td>
                        <td className="px-6 py-3.5 text-sm text-slate-600">
                          {voucher.supplierId ? (
                            <div className="flex items-center gap-1.5">
                              <Building2 className="w-3.5 h-3.5 text-slate-400" />
                              {supplierMap.get(voucher.supplierId) || "Unknown"}
                            </div>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-6 py-3.5 text-sm font-semibold text-slate-900 text-right">
                          <span className="inline-flex items-center gap-1 justify-end">
                            PKR {voucher.netAmount.toFixed(2)}/-
                          </span>
                        </td>
                        <td className="px-6 py-3.5 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/stock/vouchers/${voucher.id}`);
                            }}
                            className="text-sm font-medium text-slate-400 hover:text-slate-900 transition-colors"
                          >
                            View →
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-slate-500">
                  Page {currentPage} of {totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-sm text-slate-600 px-3">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() =>
                      setCurrentPage(Math.min(totalPages, currentPage + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
