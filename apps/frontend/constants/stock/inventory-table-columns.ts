export const INVENTORY_COLUMNS = [
  { key: "expand", label: "", width: "4%", sortable: false },
  { key: "name", label: "Product", width: "26%", sortable: true },
  { key: "code", label: "Code / Barcode", width: "16%", sortable: false },
  { key: "shelfNo", label: "Shelf", width: "8%", sortable: false },
  { key: "totalQuantity", label: "Stock", width: "10%", sortable: true },
  { key: "retailRate", label: "Retail Rate", width: "12%", sortable: true },
  {
    key: "nearestExpiryDate",
    label: "Nearest Expiry",
    width: "14%",
    sortable: true,
  },
  { key: "status", label: "Status", width: "10%", sortable: false },
] as const;

export const BATCH_COLUMNS = [
  { key: "batchNumber", label: "Batch No", width: "20%" },
  { key: "expiryDate", label: "Expiry", width: "20%" },
  { key: "currentQuantity", label: "Qty", width: "15%" },
  { key: "purchaseRate", label: "Purchase Rate", width: "20%" },
  { key: "saleRate", label: "Sale Rate", width: "20%" },
] as const;
