/**
 * Dashboard headline insight → primary navigation action.
 * @param {ReturnType<import('./insights').computeInsights>} insights
 * @returns {{ route: string, ctaKey: string }}
 */
export function getHeadlineAction(insights) {
  if (insights.flags.overcommitted || insights.flags.negativeSurplus) {
    return { route: 'budget', ctaKey: 'dashboard.insights.actions.reviewBudget' };
  }
  if (insights.flags.tight) {
    return { route: 'costs', ctaKey: 'dashboard.insights.actions.reviewExpenses' };
  }
  if (insights.highAprDebts?.length > 0) {
    return { route: 'costs', ctaKey: 'dashboard.insights.actions.reviewDebts' };
  }
  if (insights.flags.manyStreaming) {
    return { route: 'costs', ctaKey: 'dashboard.insights.actions.reviewSubscriptions' };
  }
  if (insights.flags.subBudgetHeavy) {
    return { route: 'costs', ctaKey: 'dashboard.insights.actions.reviewSubscriptions' };
  }
  if (insights.topCategories?.[0]) {
    return { route: 'costs', ctaKey: 'dashboard.insights.actions.reviewExpenses' };
  }
  return { route: 'summary', ctaKey: 'dashboard.insights.viewAnalysis' };
}
