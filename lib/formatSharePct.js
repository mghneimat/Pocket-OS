/** Format a share of total as a percentage string with 2 decimal places. */
export function formatSharePct(value, total) {
  if (total <= 0) return '0.00%';
  return `${((value / total) * 100).toFixed(2)}%`;
}

/** @deprecated Use formatSharePct */
export const pct = formatSharePct;
