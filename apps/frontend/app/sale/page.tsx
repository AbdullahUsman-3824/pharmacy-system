import { SearchBar } from "@/components/sale/SearchBar";
import { ItemsTable } from "@/components/sale/ItemsTable";
import { SaleSummary } from "@/components/sale/SaleSummary";
import { saleLineItems } from "@/lib/data";

export default function SalePage() {
  const gross = saleLineItems.reduce(
    (sum, item) => sum + item.qty * item.rate,
    0,
  );

  return (
    <>
      <SearchBar />

      <div className="mt-4 flex h-[calc(100%-56px)] gap-4">
        <ItemsTable items={saleLineItems} />
        <SaleSummary gross={gross} discount={0} />
      </div>
    </>
  );
}
