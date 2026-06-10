import { loadHouseholdFinancials } from './householdBudget';
import { computeInsights } from './insights';
import { effectiveSpendingBudget } from './finance';
import { getMonthlySavingsReservation } from './incomeGoals';

/**
 * Effective monthly spending budget (after optional savings-goal reservation).
 * @param {(key: string, params?: object) => string} t
 * @returns {Promise<number>}
 */
async function resolveSpendingMonthly(t) {
  const financials = await loadHouseholdFinancials(t);
  const insights = computeInsights(financials);
  const deductSavingsGoal = financials.budget?.deductSavingsGoal === true;
  const savingsGoalDeduction = deductSavingsGoal
    ? getMonthlySavingsReservation(financials.income, insights.goalGap)
    : 0;
  return effectiveSpendingBudget(
    financials.monthlyFlexible,
    savingsGoalDeduction,
    deductSavingsGoal,
  );
}

/**
 * Snapshot spending budget before/after an inline save for post-save feedback.
 * @param {(key: string, params?: object) => string} t
 * @param {() => Promise<void>} saveFn
 * @returns {Promise<{ before: number, after: number, delta: number }>}
 */
export async function runInlineSave(t, saveFn) {
  const before = await resolveSpendingMonthly(t);
  await saveFn();
  const after = await resolveSpendingMonthly(t);
  return { before, after, delta: after - before };
}
