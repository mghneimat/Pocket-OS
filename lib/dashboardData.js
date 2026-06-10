import { loadHouseholdFinancials } from './householdBudget';
import { computeInsights } from './insights';
import { syncAlerts, getActiveAlerts } from './alerts';
import { effectiveSpendingBudget } from './finance';
import { getMonthlySavingsReservation } from './incomeGoals';
import { ensureMonthEndProcessed } from './monthEndRouting';
import { loadDailyLogs } from './dailyLog';
import { ensureCommittedBaseline } from './costReductionProgress';

/**
 * Load financials, insights, and synced alerts in one call for dashboard screens.
 * @param {(key: string, params?: object) => string} t
 */
export async function loadDashboardBundle(t) {
  const financials = await loadHouseholdFinancials(t);
  const insights = computeInsights(financials);
  const committedBaseline = await ensureCommittedBaseline(financials);
  const budgetWithBaseline = {
    ...(financials.budget || {}),
    committedBaseline,
  };
  const deductSavingsGoal = financials.budget?.deductSavingsGoal === true;
  const savingsGoalReservation = getMonthlySavingsReservation(financials.income, insights.goalGap);
  const savingsGoalDeduction = deductSavingsGoal ? savingsGoalReservation : 0;
  const effectiveMonthlyFlexible = effectiveSpendingBudget(
    financials.monthlyFlexible,
    savingsGoalDeduction,
    deductSavingsGoal,
  );

  const { budget: closedBudget, income: closedIncome } = await ensureMonthEndProcessed({
    budget: financials.budget,
    income: financials.income,
    effectiveMonthlyFlexible,
  });

  const dailyLogs = await loadDailyLogs();

  const enrichedFinancials = {
    ...financials,
    income: closedIncome ?? financials.income,
    budget: { ...(closedBudget ?? budgetWithBaseline), committedBaseline },
    deductSavingsGoal,
    savingsGoalReservation,
    savingsGoalDeduction,
    effectiveMonthlyFlexible,
    budgetSavingsShift: financials.budgetSavingsShift || 0,
    dailyLogs,
  };
  const alerts = await syncAlerts({
    subs: financials.sections.subs,
    health: financials.sections.health,
    debts: financials.debts,
    transport: financials.sections.transport,
  }, t);

  return {
    financials: enrichedFinancials,
    insights,
    alerts,
    activeAlerts: getActiveAlerts(alerts),
  };
}
