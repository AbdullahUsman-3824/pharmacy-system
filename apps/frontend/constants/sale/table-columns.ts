export interface Column {
  key: string;
  label: string;
  width: string;
}

export function getColumns(): Column[] {
  return [
    { key: "product", label: "Product", width: "35%" },
    { key: "batch", label: "Batch", width: "15%" },
    { key: "expiry", label: "Expiry", width: "10%" },
    { key: "quantity", label: "Quantity", width: "15%" },
    { key: "rate", label: "RATE (PKR)", width: "12%" },
    { key: "net", label: "Net", width: "8%" },
    { key: "actions", label: "", width: "5%" },
  ];
}
