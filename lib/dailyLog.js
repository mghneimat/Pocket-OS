import { getData, setData } from './storage';

/**
 * @typedef {import('./schema').DailyLog} DailyLog
 */

/**
 * @param {Date} [date]
 * @returns {string} YYYY-MM
 */
export function periodKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

/**
 * @param {string} period - YYYY-MM
 * @returns {boolean}
 */
export function isDateInPeriod(isoDate, period) {
  if (!isoDate || !period) return false;
  return isoDate.slice(0, 7) === period;
}

/**
 * @returns {Promise<DailyLog[]>}
 */
export async function loadDailyLogs() {
  const logs = await getData('pocketos_daily_log');
  return Array.isArray(logs) ? logs : [];
}

/**
 * @param {DailyLog[]} logs
 * @returns {Promise<void>}
 */
export async function saveDailyLogs(logs) {
  await setData('pocketos_daily_log', logs);
}

/**
 * @param {DailyLog[]} logs
 * @param {string} period - YYYY-MM
 * @returns {number}
 */
export function sumSpentInPeriod(logs, period) {
  if (!Array.isArray(logs) || !period) return 0;
  return logs.reduce((sum, entry) => {
    if (!isDateInPeriod(entry.date, period)) return sum;
    return sum + (Number(entry.spent) || 0);
  }, 0);
}

/**
 * @param {DailyLog[]} logs
 * @param {string} isoDate - YYYY-MM-DD
 * @param {number} spent
 * @returns {DailyLog[]}
 */
/**
 * @param {Date} [date]
 * @returns {string} YYYY-MM-DD
 */
export function isoDateKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Monday-start week bounds for a date.
 * @param {Date} [date]
 * @returns {{ weekStart: string, weekEnd: string }}
 */
export function getWeekBounds(date = new Date()) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = d.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diffToMonday);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return { weekStart: isoDateKey(monday), weekEnd: isoDateKey(sunday) };
}

/**
 * @param {DailyLog[]} logs
 * @param {string} isoDate - YYYY-MM-DD
 * @returns {number}
 */
export function sumSpentOnDate(logs, isoDate) {
  if (!Array.isArray(logs) || !isoDate) return 0;
  const entry = logs.find((e) => e.date === isoDate);
  return entry ? Number(entry.spent) || 0 : 0;
}

/**
 * @param {DailyLog[]} logs
 * @param {string} startIso - YYYY-MM-DD inclusive
 * @param {string} endIso - YYYY-MM-DD inclusive
 * @returns {number}
 */
export function sumSpentBetween(logs, startIso, endIso) {
  if (!Array.isArray(logs) || !startIso || !endIso) return 0;
  return logs.reduce((sum, entry) => {
    if (entry.date >= startIso && entry.date <= endIso) {
      return sum + (Number(entry.spent) || 0);
    }
    return sum;
  }, 0);
}

export function upsertDailyLog(logs, isoDate, spent) {
  const amount = Math.max(0, Number(spent) || 0);
  const next = Array.isArray(logs) ? [...logs] : [];
  const idx = next.findIndex((e) => e.date === isoDate);
  if (amount === 0) {
    if (idx >= 0) next.splice(idx, 1);
    return next;
  }
  if (idx >= 0) {
    next[idx] = { date: isoDate, spent: amount };
  } else {
    next.push({ date: isoDate, spent: amount });
  }
  return next;
}
