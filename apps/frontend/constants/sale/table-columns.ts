export interface Column {
  key: string;
  label: string;
  width: string;
}

export function getColumns(): Column[] {
  return [
    { key: "product", label: "Product", width: "22%" },
    { key: "batch", label: "Batch", width: "22%" },
    { key: "expiry", label: "Expiry", width: "9%" },
    { key: "quantity", label: "Quantity", width: "16%" },
    { key: "rate", label: "Rate", width: "14%" },
    { key: "net", label: "Net", width: "10%" },
    { key: "actions", label: "", width: "7%" },
  ];
}
