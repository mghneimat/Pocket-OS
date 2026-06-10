const MONTH_KEYS = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december',
];

function pad2(n) {
  return String(n).padStart(2, '0');
}

/**
 * @param {string} value
 * @param {boolean} showDay
 * @returns {{ day: number|null, month: number|null, year: number|null }}
 */
export function parseStoredDate(value, showDay = true) {
  if (!value) return { day: null, month: null, year: null };
  const parts = value.split('/');
  if (showDay && parts.length === 3) {
    return {
      day: parseInt(parts[0], 10) || null,
      month: parseInt(parts[1], 10) || null,
      year: parseInt(parts[2], 10) || null,
    };
  }
  if (!showDay && parts.length === 3) {
    return {
      day: null,
      month: parseInt(parts[1], 10) || null,
      year: parseInt(parts[2], 10) || null,
    };
  }
  if (parts.length >= 2) {
    return {
      day: null,
      month: parseInt(parts[0], 10) || null,
      year: parseInt(parts[1], 10) || null,
    };
  }
  return { day: null, month: null, year: null };
}

function monthKey(month) {
  if (!month || month < 1 || month > 12) return null;
  return MONTH_KEYS[month - 1] ?? null;
}

/**
 * @param {{ day?: number|null, month?: number|null, year?: number|null }} parts
 * @param {boolean} showDay
 * @returns {string}
 */
export function formatStoredDate({ day, month, year }, showDay = true) {
  if (!month || !year) return '';
  if (showDay) {
    const d = day ? pad2(day) : '';
    return `${d}/${pad2(month)}/${year}`;
  }
  return `${pad2(month)}/${year}`;
}

/**
 * Human-readable display for a stored value.
 * @param {string} value
 * @param {boolean} showDay
 * @param {(key: string) => string} t
 */
export function formatDateDisplay(value, showDay, t) {
  const { day, month, year } = parseStoredDate(value, showDay);
  const key = monthKey(month);
  if (!key || !year) return value || '';
  const monthName = t(`common.months.${key}`);
  if (showDay && day) return `${pad2(day)} ${monthName} ${year}`;
  return `${monthName} ${year}`;
}

/**
 * Resolve month number from typed prefix (name or number).
 * @param {string} token
 * @param {(key: string) => string} t
 * @returns {number|null}
 */
function resolveMonthToken(token, t) {
  const trimmed = token.trim().toLowerCase();
  if (!trimmed) return null;
  const asNum = parseInt(trimmed, 10);
  if (!Number.isNaN(asNum) && asNum >= 1 && asNum <= 12) return asNum;
  for (let i = 0; i < MONTH_KEYS.length; i++) {
    const name = t(`common.months.${MONTH_KEYS[i]}`).toLowerCase();
    if (name.startsWith(trimmed) || name.includes(trimmed)) return i + 1;
  }
  return null;
}

/**
 * Parse free-form user input into canonical stored date string.
 * @param {string} input
 * @param {boolean} showDay
 * @param {(key: string) => string} t
 * @returns {string|null}
 */
export function parseLooseDate(input, showDay, t) {
  if (!input?.trim()) return null;
  const s = input.trim();

  if (showDay) {
    const full = s.match(/^(\d{1,2})\s*[\/\-.]\s*(\d{1,2})\s*[\/\-.]\s*(\d{4})$/);
    if (full) {
      const day = parseInt(full[1], 10);
      const month = parseInt(full[2], 10);
      const year = parseInt(full[3], 10);
      if (day >= 1 && day <= 31 && month >= 1 && month <= 12) {
        return formatStoredDate({ day, month, year }, true);
      }
    }
  }

  const monthYear = s.match(/^(\d{1,2})\s*[\/\-.]\s*(\d{4})$/);
  if (monthYear && !showDay) {
    const month = parseInt(monthYear[1], 10);
    const year = parseInt(monthYear[2], 10);
    if (month >= 1 && month <= 12) return formatStoredDate({ month, year }, false);
  }

  const nameYear = s.match(/^([a-zA-ZáčďéěíňóřšťúůýžÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ]+)\s+(\d{4})$/i);
  if (nameYear) {
    const month = resolveMonthToken(nameYear[1], t);
    const year = parseInt(nameYear[2], 10);
    if (month) return formatStoredDate({ day: showDay ? 1 : null, month, year }, showDay);
  }

  const monthOnly = resolveMonthToken(s, t);
  if (monthOnly) {
    const year = new Date().getFullYear();
    return formatStoredDate({ day: showDay ? 1 : null, month: monthOnly, year }, showDay);
  }

  return null;
}

/**
 * @param {Object} opts
 * @param {string} opts.query
 * @param {boolean} opts.showDay
 * @param {number} opts.yearStart
 * @param {number} opts.yearEnd
 * @param {(key: string) => string} opts.t
 * @returns {Array<{ label: string, value: string }>}
 */
export function buildDateSuggestions({ query, showDay, yearStart, yearEnd, t }) {
  const q = (query || '').trim().toLowerCase();
  const now = new Date();
  const currentYear = now.getFullYear();
  const seen = new Set();
  const results = [];

  const push = (label, value) => {
    if (!value || seen.has(value)) return;
    seen.add(value);
    results.push({ label, value });
  };

  // Month name + upcoming years
  MONTH_KEYS.forEach((key, idx) => {
    const monthNum = idx + 1;
    const monthName = t(`common.months.${key}`);
    const monthLower = monthName.toLowerCase();
    if (q && !monthLower.startsWith(q) && !monthLower.includes(q) && !String(monthNum).startsWith(q)) {
      return;
    }
    for (let y = Math.max(yearStart, currentYear); y <= yearEnd && results.length < 12; y++) {
      push(
        showDay ? `${monthName} ${y}` : `${monthName} ${y}`,
        formatStoredDate({ day: showDay ? 1 : null, month: monthNum, year: y }, showDay),
      );
    }
  });

  // Numeric MM/YYYY or partial year completion
  const numericMY = q.match(/^(\d{1,2})\s*[\/\-.]?\s*(\d{0,4})$/);
  if (numericMY && !showDay) {
    const month = parseInt(numericMY[1], 10);
    const yearPart = numericMY[2];
    if (month >= 1 && month <= 12) {
      if (yearPart && yearPart.length === 4) {
        push(
          `${pad2(month)}/${yearPart}`,
          formatStoredDate({ month, year: parseInt(yearPart, 10) }, false),
        );
      } else {
        const prefix = yearPart || String(currentYear);
        for (let y = yearStart; y <= yearEnd && results.length < 8; y++) {
          if (String(y).startsWith(prefix)) {
            push(`${pad2(month)}/${y}`, formatStoredDate({ month, year: y }, false));
          }
        }
      }
    }
  }

  // DD/MM/YYYY numeric
  const numericFull = q.match(/^(\d{1,2})\s*[\/\-.]\s*(\d{1,2})\s*[\/\-.]?\s*(\d{0,4})$/);
  if (numericFull && showDay) {
    const day = parseInt(numericFull[1], 10);
    const month = parseInt(numericFull[2], 10);
    const yearPart = numericFull[3];
    if (day >= 1 && day <= 31 && month >= 1 && month <= 12) {
      if (yearPart && yearPart.length === 4) {
        push(
          `${pad2(day)}/${pad2(month)}/${yearPart}`,
          formatStoredDate({ day, month, year: parseInt(yearPart, 10) }, true),
        );
      } else {
        const prefix = yearPart || String(currentYear);
        for (let y = yearStart; y <= yearEnd && results.length < 8; y++) {
          if (String(y).startsWith(prefix)) {
            push(
              `${pad2(day)}/${pad2(month)}/${y}`,
              formatStoredDate({ day, month, year: y }, true),
            );
          }
        }
      }
    }
  }

  // Year-only tail: "06/202" -> complete years
  const yearTail = q.match(/^(\d{1,2})\s*[\/\-.]\s*(\d{1,3})$/);
  if (yearTail && !showDay && results.length < 8) {
    const month = parseInt(yearTail[1], 10);
    const prefix = yearTail[2];
    if (month >= 1 && month <= 12) {
      for (let y = yearStart; y <= yearEnd; y++) {
        if (String(y).startsWith(prefix)) {
          push(`${pad2(month)}/${y}`, formatStoredDate({ month, year: y }, false));
        }
      }
    }
  }

  return results.slice(0, 6);
}
