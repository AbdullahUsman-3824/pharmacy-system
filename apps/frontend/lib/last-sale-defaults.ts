const DISCOUNT_KEY = "pos:lastDiscountPercent";
const TAX_KEY = "pos:lastTaxPercent";

export function getLastDiscountPercent(): number {
  if (typeof window === "undefined") return 0;
  return Number(localStorage.getItem(DISCOUNT_KEY)) || 0;
}

export function getLastTaxPercent(): number {
  if (typeof window === "undefined") return 0;
  return Number(localStorage.getItem(TAX_KEY)) || 0;
}

export function setLastDiscountPercent(value: number) {
  localStorage.setItem(DISCOUNT_KEY, String(value));
}

export function setLastTaxPercent(value: number) {
  localStorage.setItem(TAX_KEY, String(value));
}
