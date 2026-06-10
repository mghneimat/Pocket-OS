import { dailyAllowance, weeklyAllowance } from './finance';
import {
  isoDateKey,
  getWeekBounds,
  sumSpentOnDate,
  sumSpentBetween,
} from './dailyLog';
import { buildMonthEndPreview } from './monthEndRouting';

/**
 * @typedef {'under'|'on_track'|'over'} TrackerPaceStatus
 */

/**
 * @param {number} allowance
 * @param {number} spent
 * @returns {TrackerPaceStatus}
 */
export function getPaceStatus(allowance, spent) {
  const budget = Number(allowance) || 0;
  const used = Number(spent) || 0;
  if (used > budget) return 'over';
  if (budget > 0 && used <= budget * 0.85) return 'under';
  return 'on_track';
}

/**
 * @param {{
 *   budget: import('./schema').Budget|null|undefined,
 *   effectiveMonthlyFlexible: number,
 *   dailyLogs: import('./schema').DailyLog[],
 *   now?: Date,
 * }} params
 */
export function buildTrackerPreviews({
  budget,
  effectiveMonthlyFlexible,
  dailyLogs,
  now = new Date(),
}) {
  const rolloverBalance = Number(budget?.rolloverBalance) || 0;
  const spendingMonthly = (Number(effectiveMonthlyFlexible) || 0) + rolloverBalance;
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const dailyBudget = Math.round(dailyAllowance(spendingMonthly, daysInMonth));
  const weeklyBudget = Math.round(weeklyAllowance(spendingMonthly));

  const today = isoDateKey(now);
  const spentToday = sumSpentOnDate(dailyLogs, today);
  const remainingToday = Math.max(0, dailyBudget - spentToday);
  const overToday = Math.max(0, spentToday - dailyBudget);

  const { weekStart, weekEnd } = getWeekBounds(now);
  const spentWeek = sumSpentBetween(dailyLogs, weekStart, weekEnd);
  const remainingWeek = Math.max(0, weeklyBudget - spentWeek);
  const overWeek = Math.max(0, spentWeek - weeklyBudget);

  const monthly = buildMonthEndPreview({
    budget,
    effectiveMonthlyFlexible,
    dailyLogs,
    now,
  });

  return {
    daily: {
      allowance: dailyBudget,
      spent: spentToday,
      remaining: remainingToday,
      over: overToday,
      status: getPaceStatus(dailyBudget, spentToday),
      hasLogs: spentToday > 0,
    },
    weekly: {
      allowance: weeklyBudget,
      spent: spentWeek,
      remaining: remainingWeek,
      over: overWeek,
      status: getPaceStatus(weeklyBudget, spentWeek),
      weekStart,
      weekEnd,
      hasLogs: spentWeek > 0,
    },
    monthly,
    spendingMonthly,
  };
}
