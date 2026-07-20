/**
 * Formats a numeric value for clean UI display.
 *
 * Rules:
 *  - Rounds to at most `decimals` decimal places (default 2).
 *  - Strips trailing zeros so 4.00 → "4", 4.50 → "4.5", 4.93 → "4.93".
 *  - Returns `fallback` (default "—") if value is null/undefined.
 */
export function formatNum(value: number | null | undefined, decimals = 2, fallback = "—"): string {
  if (value === null || value === undefined || isNaN(value)) return fallback;
  return Number(value.toFixed(decimals)).toString();
}

export function formatPct(value: number | null | undefined, decimals = 2, fallback = "—"): string {
  if (value === null || value === undefined || isNaN(value)) return fallback;
  return `${Number(value.toFixed(decimals)).toString()}%`;
}
