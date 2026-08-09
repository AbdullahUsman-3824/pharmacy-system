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
