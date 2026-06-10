/**
 * Split flexible budget between spending and voluntary monthly savings.
 */

export const BUDGET_SPLIT_INCREMENT = 500;

/**
 * @param {number|null|undefined} ratio
 * @returns {number} 0–1
 */
export function clampBudgetSpendingRatio(ratio) {
  const n = Number(ratio);
  if (!Number.isFinite(n)) return 1;
  return Math.max(0, Math.min(1, n));
}

/**
 * Valid spending amounts in 500 increments, always including the full available total.
 * @param {number} totalAvailable
 * @returns {number[]}
 */
export function getSpendingSteps(totalAvailable) {
  const base = Math.max(0, Math.round(Number(totalAvailable) || 0));
  if (base === 0) return [0];

  const steps = [];
  for (let amount = 0; amount <= base; amount += BUDGET_SPLIT_INCREMENT) {
    steps.push(amount);
  }
  if (steps[steps.length - 1] !== base) {
    steps.push(base);
  }
  return steps;
}

/**
 * @param {number} totalAvailable
 * @param {number} rawSpending
 * @returns {number}
 */
export function snapSpendingMonthly(totalAvailable, rawSpending) {
  const steps = getSpendingSteps(totalAvailable);
  const max = steps[steps.length - 1];
  const clamped = Math.max(0, Math.min(max, Math.round(Number(rawSpending) || 0)));
  return steps.reduce(
    (best, step) => (Math.abs(step - clamped) < Math.abs(best - clamped) ? step : best),
    steps[0],
  );
}

/**
 * @param {number} totalAvailable
 * @param {number|null|undefined} ratio
 * @returns {number}
 */
export function ratioToSnappedSpending(totalAvailable, ratio) {
  const base = Math.max(0, Number(totalAvailable) || 0);
  if (base <= 0) return 0;
  return snapSpendingMonthly(base, base * clampBudgetSpendingRatio(ratio));
}

/**
 * @param {number} monthlyFlexible - Available flexible budget before split
 * @param {number|null|undefined} ratio - Share kept for spending (1 = all spending)
 * @returns {{ spendingMonthly: number, savingsShift: number, ratio: number }}
 */
export function splitFlexibleBudget(monthlyFlexible, ratio) {
  const base = Math.max(0, Number(monthlyFlexible) || 0);
  const spendingMonthly = ratioToSnappedSpending(base, ratio);
  const savingsShift = Math.max(0, base - spendingMonthly);
  const resolvedRatio = base > 0 ? spendingMonthly / base : 1;
  return { spendingMonthly, savingsShift, ratio: resolvedRatio };
}

/**
 * Resolve spending ratio from saved budget (ratio field or legacy monthlyFlexible / avail).
 * @param {{ budgetSpendingRatio?: number, monthlyFlexible?: number }|null|undefined} budget
 * @param {number} availableBudget
 * @returns {number}
 */
export function resolveBudgetSpendingRatio(budget, availableBudget) {
  if (budget?.budgetSpendingRatio != null) {
    return clampBudgetSpendingRatio(budget.budgetSpendingRatio);
  }
  const avail = Number(availableBudget) || 0;
  const saved = budget?.monthlyFlexible;
  if (saved != null && avail > 0) {
    return clampBudgetSpendingRatio(Number(saved) / avail);
  }
  return 1;
}
