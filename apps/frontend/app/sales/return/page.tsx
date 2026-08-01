"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
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
import { ChevronDown, Loader2, X } from "lucide-react";

import { PageContainer, PageHeader, PageSection } from "@/components/layout";
import { DataTable, DataTableColumn } from "@/components/shared/data-table";
import LoadingState from "@/components/shared/loading-state";
import EmptyState from "@/components/shared/empty-state";

import Card from "@/components/ui/card";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function SaleReturnForm() {
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
      router.push(`/sales/${result.id}`);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      setApiError(
        error?.message ?? "Failed to process return. Please try again.",
      );
    }
  };

  type LineField = (typeof fields)[number];

  const columns: DataTableColumn<LineField>[] = useMemo(
    () => [
      {
        key: "productName",
        dataKey: "productName",
        title: "Product",
        render: (row) => (
          <span className="font-medium text-[var(--color-text)]">
            {row.productName ?? "—"}
          </span>
        ),
      },
      {
        key: "batchNumber",
        dataKey: "batchNumber",
        title: "Batch",
        width: 110,
        align: "center",
        render: (row) => (
          <span className="font-mono text-xs text-[var(--color-text-secondary)]">
            {row.batchNumber}
          </span>
        ),
      },
      {
        key: "maxPacks",
        dataKey: "maxPacks",
        title: "Avail Packs",
        width: 100,
        align: "right",
      },
      {
        key: "returnPacks",
        title: "Return Packs",
        width: 120,
        align: "right",
        render: (row, index) => (
          <Input
            type="number"
            min={0}
            max={row.maxPacks}
            error={errors.lines?.[index]?.packQuantity?.message as string}
            className="text-right"
            {...register(`lines.${index}.packQuantity`)}
          />
        ),
      },
      {
        key: "maxLoose",
        dataKey: "maxLoose",
        title: "Avail Loose",
        width: 100,
        align: "right",
      },
      {
        key: "returnLoose",
        title: "Return Loose",
        width: 120,
        align: "right",
        render: (row, index) => (
          <Input
            type="number"
            min={0}
            max={row.maxLoose}
            error={errors.lines?.[index]?.looseQuantity?.message as string}
            className="text-right"
            {...register(`lines.${index}.looseQuantity`)}
          />
        ),
      },
    ],
    [errors.lines, register],
  );

  return (
    <PageContainer>
      <PageHeader
        title="Process a Return"
        description="Find a sale and select items to return."
      >
        <Button variant="secondary" onClick={() => router.push("/sales")}>
          Back
        </Button>
      </PageHeader>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
        {/* Search — hidden once a sale is selected */}
        {!selectedSaleId && (
          <PageSection>
            <div ref={searchRef} className="relative">
              <div className="relative">
                <input
                  value={searchInput}
                  onChange={(e) => handleInputChange(e.target.value)}
                  onFocus={() => {
                    if (normalizedInput.length >= 2) setIsDropdownOpen(true);
                  }}
                  onKeyDown={handleInputKeyDown}
                  placeholder="Type a sale number to search (e.g. SL-250731)"
                  className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-2.5 pr-10 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-placeholder)] outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20"
                  autoFocus
                />
                {isSearching && normalizedInput.length >= 2 && (
                  <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[var(--color-text-muted)]">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                )}
                {!isSearching && normalizedInput.length >= 2 && (
                  <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[var(--color-text-muted)]">
                    <ChevronDown className="h-4 w-4" />
                  </div>
                )}
              </div>

              {showDropdown && (
                <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] shadow-[var(--shadow-md)]">
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
                            className={`flex w-full cursor-pointer flex-col gap-1 px-4 py-3 text-left transition-colors ${
                              isActive
                                ? "bg-[var(--color-primary)]/10"
                                : "hover:bg-[var(--color-primary)]/5"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <span className="font-mono text-sm font-semibold text-[var(--color-text)]">
                                {saleItem.saleNumber}
                              </span>
                              <span className="text-xs text-[var(--color-text-muted)]">
                                {new Date(saleItem.date).toLocaleDateString()}
                              </span>
                            </div>
                            <span className="text-sm text-[var(--color-text-secondary)]">
                              {saleItem.customerName}
                            </span>
                          </button>
                        );
                      })
                    ) : hasNoMatches ? (
                      <div className="px-4 py-3 text-sm text-[var(--color-text-muted)]">
                        No matching sales found
                      </div>
                    ) : (
                      <div className="px-4 py-3 text-sm text-[var(--color-text-muted)]">
                        Searching...
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </PageSection>
        )}

        {selectedSaleId && saleLoading && <LoadingState />}

        {selectedSaleId && saleNotFound && (
          <div className="flex flex-col items-center gap-4">
            <EmptyState
              title="Sale not found"
              description="No sale found for the selected sale."
            />
            <Button variant="secondary" onClick={handleChangeSale}>
              Search again
            </Button>
          </div>
        )}

        {/* Return Form */}
        {sale && selectedSaleId && (
          <>
            <PageSection>
              <Card className="flex items-start justify-between gap-4">
                <div className="grid flex-1 grid-cols-1 gap-4 text-sm sm:grid-cols-2">
                  <div>
                    <span className="text-[var(--color-text-muted)]">
                      Sale Number
                    </span>
                    <p className="font-mono text-base font-medium text-[var(--color-text)]">
                      {sale.saleNumber}
                    </p>
                  </div>
                  <div>
                    <span className="text-[var(--color-text-muted)]">
                      Customer
                    </span>
                    <p className="text-base font-medium text-[var(--color-text)]">
                      {sale.customerName}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleChangeSale}
                  className="flex items-center gap-1 whitespace-nowrap text-xs text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-primary)]"
                >
                  <X className="h-3.5 w-3.5" />
                  Change sale
                </button>
              </Card>
            </PageSection>

            {returnableLoading ? (
              <LoadingState />
            ) : (
              fields.length > 0 && (
                <>
                  <PageSection>
                    <DataTable
                      columns={columns}
                      data={fields}
                      rowKey={(row) => row.id}
                      emptyTitle="No returnable items"
                    />
                  </PageSection>

                  <div className="flex flex-col gap-6 sm:flex-row">
                    <div className="flex-1">
                      <div className="flex flex-wrap gap-4">
                      <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-[var(--color-text-secondary)]">
                          Discount %
                        </label>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          className="w-20 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-1.5 text-sm text-[var(--color-text)] outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20"
                          {...register("discountPercent")}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-[var(--color-text-secondary)]">
                          Tax %
                        </label>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          className="w-20 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-1.5 text-sm text-[var(--color-text)] outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20"
                          {...register("taxPercent")}
                        />
                      </div>
                    </div>
                    </div>

                    <Card className="w-full sm:w-72">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-[var(--color-text-muted)]">
                            Gross
                          </span>
                          <span className="text-[var(--color-text-secondary)]">
                            {formatCurrency(totals.gross)}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-[var(--color-text-muted)]">
                            Discount
                          </span>
                          <span className="text-[var(--color-danger-text)]">
                            -{formatCurrency(totals.discount)}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-[var(--color-text-muted)]">
                            Tax
                          </span>
                          <span className="text-[var(--color-text-secondary)]">
                            {formatCurrency(totals.tax)}
                          </span>
                        </div>
                        <div className="mt-2 border-t border-[var(--color-border)] pt-2">
                          <div className="flex justify-between text-base font-bold">
                            <span className="text-[var(--color-text)]">
                              Net Refund
                            </span>
                            <span className="text-[var(--color-primary)]">
                              {formatCurrency(totals.net)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </div>

                  {apiError && (
                    <div className="rounded-[var(--radius-lg)] border border-[var(--color-danger-border)] bg-[var(--color-danger-soft)] p-4">
                      <p className="text-sm text-[var(--color-danger-text)]">
                        {apiError}
                      </p>
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={createSale.isPending}
                    className="w-full"
                  >
                    {createSale.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      "Process Return"
                    )}
                  </Button>
                </>
              )
            )}
          </>
        )}
      </form>
    </PageContainer>
  );
}

export default function SaleReturnPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <SaleReturnForm />
    </Suspense>
  );
}