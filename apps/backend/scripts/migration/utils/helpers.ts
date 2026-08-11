export function renderProgressBar(
  current: number,
  total: number,
  label: string,
) {
  const width = 30;
  const percent = current / total;
  const filled = Math.round(width * percent);
  const bar = '█'.repeat(filled) + '░'.repeat(width - filled);

  process.stdout.write(
    `\r  [${bar}] ${current}/${total} (${(percent * 100).toFixed(0)}%) ${label}`,
  );
}

export function emptyToNull(value: string | null | undefined): string | null {
  if (value === null || value === undefined) return null;

  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}

export function normalizeBatchNumber(value: unknown): string {
  if (value == null) return '';

  if (typeof value === 'string' || typeof value === 'number') {
    return String(value).trim();
  }

  throw new TypeError(
    `Expected string | number | null | undefined for batch number, got ${typeof value}`,
  );
}

export function normalizeExpiryDate(value: unknown): Date | null {
  if (!value) return null;

  const date = new Date(value as string | number | Date);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

export function fitsDecimal(
  value: unknown,
  precision: number,
  scale: number,
): boolean {
  if (value === null || value === undefined) return true;

  const number = Number(value);

  if (!Number.isFinite(number)) {
    return false;
  }

  const maxIntegerDigits = precision - scale;
  const max = 10 ** maxIntegerDigits - 10 ** -scale;

  return Math.abs(number) <= max;
}

const INT4_MIN = -2147483648;
const INT4_MAX = 2147483647;

export function fitsInt(value: unknown): boolean {
  if (value === null || value === undefined) return true;

  const number = Number(value);

  if (!Number.isFinite(number)) {
    return false;
  }

  if (number < INT4_MIN || number > INT4_MAX) {
    return false;
  }

  return Math.abs(number - Math.round(number)) < 0.001;
}
