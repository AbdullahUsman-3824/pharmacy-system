"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useSaleDetail,
  useSaleSearch,
  useReturnableItems,
  useCreateSale,
} from "@/hooks/useSale";
import {
  saleReturnFormSchema,
  SaleReturnFormInput,
  SaleReturnFormOutput,
} from "@/schemas/sale-return-form";
import { buildReturnPayload } from "./build-return-payload";
import { formatCurrency } from "@/lib/format";
import { ArrowLeft, ChevronDown, Loader2, X } from "lucide-react";

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export default function SaleReturnPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchRef = useRef<HTMLDivElement | null>(null);

  // Coming from the sale detail page's "Return items" link — the id is
  // already known, so we skip search entirely and load directly. This
  // avoids the old flow of: search by number -> pick a match -> then fetch
  // the real sale, which fired the search API for no reason when the sale
  // was already identified.
  const initialSaleId = searchParams.get("saleId") ?? "";

  const [searchInput, setSearchInput] = useState("");
  const [selectedSaleId, setSelectedSaleId] = useState<string | null>(
    initialSaleId || null,
  );
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [apiError, setApiError] = useState<string | null>(null);

  const normalizedInput = searchInput.trim();

  // Disabled (empty query -> hook itself no-ops) whenever a sale is
  // already selected, so picking a result — or arriving via saleId —
  // doesn't keep firing search requests in the background.
  const {
    data: searchResults = [],
    isFetching: isSearching,
    isFetched: searchFetched,
  } = useSaleSearch(selectedSaleId ? "" : normalizedInput);

  const {
    data: sale,
    isLoading: saleLoading,
    isError: saleNotFound,
  } = useSaleDetail(selectedSaleId ?? "");

  const { data: returnable, isLoading: returnableLoading } = useReturnableItems(
    sale?.id ?? "",
  );

  const createSale = useCreateSale();

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SaleReturnFormInput, unknown, SaleReturnFormOutput>({
    resolver: zodResolver(saleReturnFormSchema),
    defaultValues: {
      originalSaleId: "",
      customerName: "",
      remarks: "",
      discountPercent: 0,
      taxPercent: 0,
      lines: [],
    },
  });

  const { fields, replace } = useFieldArray({ control, name: "lines" });
  const watchedLines = useWatch({ control, name: "lines" });
  const discountPercent = (useWatch({ control, name: "discountPercent" }) ??
    0) as number;
  const taxPercent = (useWatch({ control, name: "taxPercent" }) ?? 0) as number;

  useEffect(() => {
    if (returnable && sale) {
      replace(
        returnable.items.map((item) => ({
          productId: item.productId,
          productName: item.productName,
          batchId: item.batchId,
          batchNumber: item.batchNumber,
          saleRate: item.saleRate,
          looseRate: item.looseRate,
          maxPacks: item.availablePacksToReturn,
          maxLoose: item.availableLooseToReturn,
          packQuantity: 0,
          looseQuantity: 0,
        })),
      );
      reset((prev) => ({
        ...prev,
        originalSaleId: sale.id,
        customerName: sale.customerName,
      }));
    }
  }, [returnable, sale, replace, reset]);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  const selectSale = (saleItem: { id: string; saleNumber: string }) => {
    setSelectedSaleId(saleItem.id);
    setSearchInput("");
    setIsDropdownOpen(false);
    setActiveIndex(-1);
    setApiError(null);
  };

  const handleChangeSale = () => {
    setSelectedSaleId(null);
    setSearchInput("");
    setApiError(null);
    // Clear the URL param too, so a refresh doesn't jump straight back
    // to the sale we're stepping away from.
    router.replace("/sale/return");
  };

  const handleInputChange = (value: string) => {
    setSearchInput(value);
    setApiError(null);
    setIsDropdownOpen(value.trim().length >= 2);
    if (value.trim().length < 2) setActiveIndex(-1);
  };

  const showDropdown =
    isDropdownOpen && !selectedSaleId && normalizedInput.length >= 2;

  const highlightedIndex =
    showDropdown && searchResults.length > 0
      ? activeIndex >= 0
        ? activeIndex
        : 0
      : -1;

  const hasNoMatches =
    showDropdown && !isSearching && searchFetched && searchResults.length === 0;

  const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isDropdownOpen) {
      if (event.key === "Escape") setIsDropdownOpen(false);
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (searchResults.length > 0) {
        setActiveIndex((current) =>
          current < 0 ? 0 : (current + 1) % searchResults.length,
        );
      }
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      if (searchResults.length > 0) {
        setActiveIndex((current) =>
          current <= 0 ? searchResults.length - 1 : current - 1,
        );
      }
      return;
    }

    if (event.key === "Enter") {
      if (highlightedIndex >= 0 && searchResults[highlightedIndex]) {
        event.preventDefault();
        selectSale(searchResults[highlightedIndex]);
      }
      return;
    }

    if (event.key === "Escape") {
      setIsDropdownOpen(false);
    }
  };

  const totals = (() => {
    const gross = (watchedLines ?? []).reduce((sum, line) => {
      const packPart =
        (Number(line?.packQuantity) || 0) * (Number(line?.saleRate) || 0);
      const loosePart =
        (Number(line?.looseQuantity) || 0) * (Number(line?.looseRate) || 0);
      return sum + packPart + loosePart;
    }, 0);
    const discount = round2(gross * (discountPercent / 100));
    const taxable = gross - discount;
    const tax = round2(taxable * (taxPercent / 100));
    const net = round2(taxable + tax);
    return { gross, discount, tax, net };
  })();

  const onSubmit = async (data: SaleReturnFormOutput) => {
    setApiError(null);
    const hasAnyReturn = data.lines.some(
      (l) => l.packQuantity > 0 || l.looseQuantity > 0,
    );
    if (!hasAnyReturn) {
      setApiError("Enter a quantity for at least one item to return.");
      return;
    }

    const payload = buildReturnPayload(data);
    try {
      const result = await createSale.mutateAsync(payload);
      router.push(`/sale/${result.id}`);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      setApiError(
        error?.message ?? "Failed to process return. Please try again.",
      );
    }
  };

  return (
    <div className="max-w-6xl mx-auto w-full py-6 px-4">
      {/* Back Navigation */}
      <Link
        href="/sale"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-4 group"
      >
        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
        Back to Sales
      </Link>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Process a Return</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Find a sale and select items to return
        </p>
      </div>

      {/* Search — hidden once a sale is selected */}
      {!selectedSaleId && (
        <div ref={searchRef} className="relative mb-6">
          <div className="relative">
            <input
              value={searchInput}
              onChange={(e) => handleInputChange(e.target.value)}
              onFocus={() => {
                if (normalizedInput.length >= 2) setIsDropdownOpen(true);
              }}
              onKeyDown={handleInputKeyDown}
              placeholder="Type a sale number to search (e.g. SL-250731)"
              className="flex-1 w-full rounded-xl border border-border px-4 py-2.5 pr-10 text-sm bg-surface-card focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
              autoFocus
            />
            {isSearching && normalizedInput.length >= 2 && (
              <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            )}
            {!isSearching && normalizedInput.length >= 2 && (
              <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-muted-foreground">
                <ChevronDown className="h-4 w-4" />
              </div>
            )}
          </div>

          {showDropdown && (
            <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border border-border bg-surface-card shadow-panel">
              <div className="max-h-72 overflow-y-auto py-2">
                {searchResults.length > 0 ? (
                  searchResults.map((saleItem, index) => {
                    const isActive = index === activeIndex;

                    return (
                      <button
                        key={saleItem.id}
                        type="button"
                        onMouseDown={(event) => {
                          event.preventDefault();
                          selectSale(saleItem);
                        }}
                        onMouseEnter={() => setActiveIndex(index)}
                        className={`flex w-full flex-col gap-1 px-4 py-3 text-left transition-colors cursor-pointer ${
                          isActive ? "bg-primary/10" : "hover:bg-primary/5"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="font-mono text-sm font-semibold text-ink-900">
                            {saleItem.saleNumber}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(saleItem.date).toLocaleDateString()}
                          </span>
                        </div>
                        <span className="text-sm text-ink-700">
                          {saleItem.customerName}
                        </span>
                      </button>
                    );
                  })
                ) : hasNoMatches ? (
                  <div className="px-4 py-3 text-sm text-muted-foreground">
                    No matching sales found
                  </div>
                ) : (
                  <div className="px-4 py-3 text-sm text-muted-foreground">
                    Searching...
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {selectedSaleId && saleLoading && (
        <div className="text-center py-8">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-primary/30 border-t-primary" />
          <p className="mt-2 text-sm text-muted-foreground">
            Loading sale details...
          </p>
        </div>
      )}

      {selectedSaleId && saleNotFound && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-center">
          <p className="text-destructive font-medium">
            No sale found for the selected sale.
          </p>
          <button
            type="button"
            onClick={handleChangeSale}
            className="text-sm text-primary hover:underline mt-1"
          >
            Search again
          </button>
        </div>
      )}

      {/* Return Form */}
      {sale && selectedSaleId && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Sale Info */}
          <div className="rounded-xl border border-border bg-surface-card p-5 shadow-panel flex items-start justify-between gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm flex-1">
              <div>
                <span className="text-ink-500">Sale Number</span>
                <p className="font-mono font-medium text-base text-ink-900">
                  {sale.saleNumber}
                </p>
              </div>
              <div>
                <span className="text-ink-500">Customer</span>
                <p className="font-medium text-base text-ink-900">
                  {sale.customerName}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleChangeSale}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors whitespace-nowrap"
            >
              <X className="h-3.5 w-3.5" />
              Change sale
            </button>
          </div>

          {returnableLoading ? (
            <div className="text-center py-8">
              <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-primary/30 border-t-primary" />
              <p className="mt-2 text-sm text-muted-foreground">
                Loading returnable items...
              </p>
            </div>
          ) : (
            fields.length > 0 && (
              <>
                {/* Items Table */}
                <div className="mt-4 flex-1 rounded-xl border border-border bg-surface-card p-5 shadow-panel">
                  <div className="grid grid-cols-[1fr_100px_80px_120px_80px_120px] border-b border-border-soft pb-2 text-sm text-ink-500">
                    <span>Product</span>
                    <span className="text-center">Batch</span>
                    <span className="text-right">Avail Packs</span>
                    <span className="text-right">Return Packs</span>
                    <span className="text-right">Avail Loose</span>
                    <span className="text-right">Return Loose</span>
                  </div>

                  <div className="divide-y divide-border-soft">
                    {fields.map((field, index) => {
                      const lineError = errors.lines?.[index];
                      return (
                        <div
                          key={field.id}
                          className="grid grid-cols-[1fr_100px_80px_120px_80px_120px] items-center py-3 text-sm"
                        >
                          <span className="font-medium text-ink-900">
                            {field.productName ?? "—"}
                          </span>
                          <span className="text-center font-mono text-xs text-ink-700">
                            {field.batchNumber}
                          </span>
                          <span className="text-right text-ink-700">
                            {field.maxPacks}
                          </span>
                          <div className="flex justify-end">
                            <div>
                              <input
                                type="number"
                                min={0}
                                max={field.maxPacks}
                                className="w-24 rounded-md border border-border px-3 py-1.5 text-right text-sm bg-surface-card focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
                                {...register(`lines.${index}.packQuantity`)}
                              />
                              {lineError?.packQuantity && (
                                <p className="text-xs text-destructive mt-1">
                                  {lineError.packQuantity.message as string}
                                </p>
                              )}
                            </div>
                          </div>
                          <span className="text-right text-ink-700">
                            {field.maxLoose}
                          </span>
                          <div className="flex justify-end">
                            <div>
                              <input
                                type="number"
                                min={0}
                                max={field.maxLoose}
                                className="w-24 rounded-md border border-border px-3 py-1.5 text-right text-sm bg-surface-card focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
                                {...register(`lines.${index}.looseQuantity`)}
                              />
                              {lineError?.looseQuantity && (
                                <p className="text-xs text-destructive mt-1">
                                  {lineError.looseQuantity.message as string}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Controls */}
                <div className="flex flex-col sm:flex-row gap-6">
                  <div className="flex-1">
                    <div className="flex flex-wrap gap-4">
                      <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-ink-700">
                          Discount %
                        </label>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          className="w-24 rounded-md border border-border px-3 py-1.5 text-sm bg-surface-card focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
                          {...register("discountPercent")}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-ink-700">
                          Tax %
                        </label>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          className="w-24 rounded-md border border-border px-3 py-1.5 text-sm bg-surface-card focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
                          {...register("taxPercent")}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="rounded-xl border border-border bg-surface-card p-5 w-full sm:w-72 shadow-panel">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-ink-500">Gross</span>
                        <span className="text-ink-700">
                          {formatCurrency(totals.gross)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-ink-500">Discount</span>
                        <span className="text-red-600">
                          -{formatCurrency(totals.discount)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-ink-500">Tax</span>
                        <span className="text-ink-700">
                          {formatCurrency(totals.tax)}
                        </span>
                      </div>
                      <div className="border-t border-border-soft pt-2 mt-2">
                        <div className="flex justify-between font-bold text-base">
                          <span className="text-ink-900">Net Refund</span>
                          <span className="text-primary">
                            {formatCurrency(totals.net)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {apiError && (
                  <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-3">
                    <p className="text-sm text-destructive">{apiError}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={createSale.isPending}
                  className="w-full rounded-xl px-4 py-3 text-sm font-medium bg-blue-900 hover:bg-blue-900/90 text-white disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {createSale.isPending ? (
                    <>
                      <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white mr-2" />
                      Processing...
                    </>
                  ) : (
                    "Process Return"
                  )}
                </button>
              </>
            )
          )}
        </form>
      )}
    </div>
  );
}
