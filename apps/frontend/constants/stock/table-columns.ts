export const BASE_COLUMNS = [
  { key: "product", label: "Product", width: 200 },
  { key: "batch", label: "Batch #", width: 100 },
  { key: "expiry", label: "Expiry", width: 110 },
  { key: "packQty", label: "Pack", width: 70 },
  { key: "looseQty", label: "Loose", width: 70 },
  { key: "prate", label: "P.Rate (pack)", width: 100 },
  { key: "srate", label: "S.Rate (pack)", width: 100 },
] as const;

export const ADVANCED_COLUMNS = [
  { key: "free", label: "Free", width: 70 },
  { key: "discPct", label: "Disc %", width: 70 },
  { key: "taxPct", label: "Tax %", width: 70 },
  { key: "gross", label: "Gross", width: 80 },
  { key: "discAmt", label: "Disc.Amt", width: 80 },
  { key: "taxAmt", label: "Tax.Amt", width: 80 },
] as const;

export const TAIL_COLUMNS = [
  { key: "net", label: "Net", width: 80 },
  { key: "actions", label: "", width: 70 },
] as const;

export function getColumns(showAdvanced: boolean) {
  return [
    ...BASE_COLUMNS,
    ...(showAdvanced ? ADVANCED_COLUMNS : []),
    ...TAIL_COLUMNS,
  ];
}
