interface Column {
  key: string;
  label: string;
  width: string;
}

export function getColumns(showAdvanced: boolean): Column[] {
  const baseColumns: Column[] = [
    { key: "product", label: "Product", width: "20%" },
    { key: "batch", label: "Batch", width: "12%" },
    { key: "expiry", label: "Expiry", width: "12%" },
    { key: "quantity", label: "Qty", width: "8%" },
    { key: "saleRate", label: "Rate", width: "10%" },
  ];

  const advancedColumns: Column[] = showAdvanced
    ? [
        { key: "discount", label: "Disc %", width: "8%" },
        { key: "tax", label: "Tax %", width: "8%" },
        { key: "gross", label: "Gross", width: "8%" },
        { key: "discAmount", label: "Disc Amt", width: "8%" },
        { key: "taxAmount", label: "Tax Amt", width: "8%" },
      ]
    : [];

  const totalColumns: Column[] = [
    { key: "net", label: "Net", width: "10%" },
    { key: "actions", label: "", width: "6%" },
  ];

  return [...baseColumns, ...advancedColumns, ...totalColumns];
}