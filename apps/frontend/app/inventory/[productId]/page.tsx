"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useMemo } from "react";
import { useProductStock } from "@/hooks/useStock";
import { useProduct } from "@/hooks/useProducts";
import { DataTable, DataTableColumn } from "@/components/shared/data-table";
import { PageContainer, PageHeader, PageSection } from "@/components/layout";
import Button from "@/components/ui/button";
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
  Building2,
  Tag,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/cn";

interface BatchRow {
  id: string;
  batchId: string;
  batchNumber: string;
  expiryDate?: string | null;
  currentQuantity: number;
  purchaseRate: number;
  saleRate: number;
}

type ExpiryStatus = {
  status: "none" | "expired" | "critical" | "warning" | "good";
  label: string;
  toneClass: string;
};

export default function ProductStockPage() {
  const { productId } = useParams<{ productId: string }>();
  const router = useRouter();
  const { data: product, isLoading: productLoading } = useProduct(productId);
  const { data: stockData, isLoading: stockLoading } =
    useProductStock(productId);

  // Lazy initializer - runs only once
  const [now] = useState(() => Date.now());

  const isLoading = productLoading || stockLoading;

  const getExpiryStatus = (expiryDate?: string | null): ExpiryStatus => {
    if (!expiryDate)
      return {
        status: "none",
        label: "No expiry",
        toneClass: "text-[var(--color-text-secondary)]",
      };

    const days = (new Date(expiryDate).getTime() - now) / (1000 * 60 * 60 * 24);

    if (days < 0) {
      return {
        status: "expired",
        label: "Expired",
        toneClass: "text-[var(--color-danger)] bg-[var(--color-danger)]/10",
      };
    } else if (days < 30) {
      return {
        status: "critical",
        label: "Expiring soon",
        toneClass: "text-[var(--color-danger)] bg-[var(--color-danger)]/10",
      };
    } else if (days < 90) {
      return {
        status: "warning",
        label: "Near expiry",
        toneClass: "text-[var(--color-warning)] bg-[var(--color-warning)]/10",
      };
    } else {
      return {
        status: "good",
        label: "Good",
        toneClass: "text-[var(--color-success)] bg-[var(--color-success)]/10",
      };
    }
  };

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

  const rows: BatchRow[] = useMemo(
    () => (stockData?.batches ?? []).map((b) => ({ ...b, id: b.batchId })),
    [stockData],
  );

  if (isLoading) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center py-24">
          <Loader2 className="w-8 h-8 text-[var(--color-text-secondary)] animate-spin" />
          <p className="text-sm text-[var(--color-text-secondary)] mt-3">
            Loading product stock...
          </p>
        </div>
      </PageContainer>
    );
  }

  if (!product || !stockData) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <AlertCircle className="w-12 h-12 text-[var(--color-danger)]" />
          <h2 className="text-lg font-semibold text-[var(--color-text)] mt-3">
            Product Not Found
          </h2>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1 max-w-md">
            The product you&apos;re looking for doesn&apos;t exist.
          </p>
          <Button
            variant="ghost"
            className="mt-4"
            onClick={() => router.push("/inventory")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Inventory
          </Button>
        </div>
      </PageContainer>
    );
  }

  const columns: DataTableColumn<BatchRow>[] = [
    {
      key: "batchNumber",
      title: "Batch #",
      render: (row: BatchRow) => (
        <span className="font-medium text-[var(--color-text)]">
          {row.batchNumber}
        </span>
      ),
    },
    {
      key: "expiryDate",
      title: "Expiry",
      render: (row: BatchRow) =>
        row.expiryDate ? (
          new Date(row.expiryDate).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })
        ) : (
          <span className="text-[var(--color-text-secondary)]">—</span>
        ),
    },
    {
      key: "status",
      title: "Status",
      render: (row: BatchRow) => {
        const expiryStatus = getExpiryStatus(row.expiryDate);
        if (!row.expiryDate) {
          return (
            <span className="text-xs text-[var(--color-text-secondary)]">
              No expiry
            </span>
          );
        }
        return (
          <span
            className={cn(
              "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[var(--radius-md)] text-xs font-medium",
              expiryStatus.toneClass,
            )}
          >
            {expiryStatus.status === "expired" && (
              <AlertCircle className="w-3 h-3" />
            )}
            {expiryStatus.status === "critical" && (
              <AlertTriangle className="w-3 h-3" />
            )}
            {expiryStatus.status === "warning" && <Clock className="w-3 h-3" />}
            {expiryStatus.status === "good" && (
              <CheckCircle className="w-3 h-3" />
            )}
            {expiryStatus.label}
          </span>
        );
      },
    },
    {
      key: "currentQuantity",
      title: "Quantity",
      align: "right",
      render: (row: BatchRow) => (
        <span className="font-semibold text-[var(--color-text)]">
          {row.currentQuantity}
        </span>
      ),
    },
    {
      key: "purchaseRate",
      title: "Purchase Rate",
      align: "right",
      render: (row: BatchRow) => `PKR ${row.purchaseRate.toFixed(2)}/-`,
    },
    {
      key: "saleRate",
      title: "Sale Rate",
      align: "right",
      render: (row: BatchRow) => `PKR ${row.saleRate.toFixed(2)}/-`,
    },
    {
      key: "value",
      title: "Value",
      align: "right",
      render: (row: BatchRow) => (
        <span className="font-semibold text-[var(--color-text)]">
          PKR {(row.currentQuantity * row.purchaseRate).toFixed(2)}/-
        </span>
      ),
    },
  ];

  return (
    <PageContainer>
      <PageHeader
        title={product.name}
        description={`Product Code: ${product.code}`}
      >
        <Button variant="ghost" onClick={() => router.push("/inventory")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Inventory
        </Button>
      </PageHeader>

      <PageSection>
        {/* Product meta strip — Group / Generic / Company, plus total stock */}
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] shadow-[var(--shadow-sm)] px-6 py-4 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-6">
            <MetaItem icon={<Package className="w-4 h-4" />} label="Product">
              {product.name}
            </MetaItem>
            {product.group && (
              <MetaItem icon={<Layers className="w-4 h-4" />} label="Group">
                {product.group.name}
              </MetaItem>
            )}
            {product.generic && (
              <MetaItem icon={<Tag className="w-4 h-4" />} label="Generic">
                {product.generic.name}
              </MetaItem>
            )}
            {product.company && (
              <MetaItem
                icon={<Building2 className="w-4 h-4" />}
                label="Company"
              >
                {product.company.name}
              </MetaItem>
            )}
          </div>

          <div className="text-right">
            <p className="text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">
              Total Stock
            </p>
            <p className="text-2xl font-bold text-[var(--color-text)]">
              {stockData.totalQuantity}
            </p>
          </div>
        </div>

        {/* Product-level stats — scoped to this product only, not duplicated
            on Dashboard or the Inventory list */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard
              icon={<Box className="w-4 h-4" />}
              label="Batches"
              value={stats.batchCount}
            />
            <StatCard
              icon={<BadgeCent className="w-4 h-4" />}
              label="Total Value"
              value={`PKR ${stats.totalValue.toFixed(2)}/-`}
            />
            <StatCard
              icon={<Clock className="w-4 h-4" />}
              label="Near Expiry"
              value={stats.nearExpiryCount}
              tone={stats.nearExpiryCount > 0 ? "warning" : undefined}
            />
            <StatCard
              icon={<AlertTriangle className="w-4 h-4" />}
              label="Expired"
              value={stats.expiredCount}
              tone={stats.expiredCount > 0 ? "danger" : undefined}
            />
          </div>
        )}

        {/* Batches */}
        <div className="flex items-center gap-2 mb-3">
          <Hash className="w-4 h-4 text-[var(--color-text-secondary)]" />
          <h2 className="font-semibold text-[var(--color-text)] text-sm">
            Batches
          </h2>
          <span className="text-xs text-[var(--color-text-secondary)] bg-[var(--color-background-muted)] px-2.5 py-0.5 rounded-full">
            {stockData.batches.length}
          </span>
        </div>

        <DataTable<BatchRow>
          columns={columns}
          data={rows}
          emptyTitle="No batches found for this product"
          rowClassName={(row) => {
            const status = getExpiryStatus(row.expiryDate).status;
            if (status === "expired" || status === "critical")
              return "bg-[var(--color-danger)]/5";
            if (status === "warning") return "bg-[var(--color-warning)]/5";
            return "";
          }}
          zebra
        />

        {/* Stock movement history for this product — TODO: needs a
            vouchers-by-productId query on the backend (StockVoucherItem
            filtered by productId, joined back to voucher). Not wired yet. */}
      </PageSection>
    </PageContainer>
  );
}

function MetaItem({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[var(--color-text-secondary)]">{icon}</span>
      <div>
        <p className="text-[10px] font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">
          {label}
        </p>
        <p className="text-sm font-medium text-[var(--color-text)]">
          {children}
        </p>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  tone?: "warning" | "danger";
}) {
  const valueColor =
    tone === "warning"
      ? "text-[var(--color-warning)]"
      : tone === "danger"
        ? "text-[var(--color-danger)]"
        : "text-[var(--color-text)]";
  const iconBg =
    tone === "warning"
      ? "bg-[var(--color-warning)]/10 text-[var(--color-warning)]"
      : tone === "danger"
        ? "bg-[var(--color-danger)]/10 text-[var(--color-danger)]"
        : "bg-[var(--color-background-muted)] text-[var(--color-text-secondary)]";

  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">
            {label}
          </p>
          <p className={cn("text-lg font-bold mt-0.5", valueColor)}>{value}</p>
        </div>
        <div className={cn("p-2 rounded-[var(--radius-md)]", iconBg)}>
          {icon}
        </div>
      </div>
    </div>
  );
}
