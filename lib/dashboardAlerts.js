import { getActiveAlerts } from './alerts';
import { formatCurrency } from './finance';
import { getCurrencySymbol } from './currency';

/** Lower sort value = higher priority in the action queue. */
const TYPE_PRIORITY = {
  subscription_renewal: 10,
  health_insurance_expiry: 20,
  insurance_renewal: 25,
  mot_due: 30,
  budget_deficit: 5,
  overcommitted: 6,
  debt_high_apr: 15,
  debt_promo_expiry: 18,
  many_streaming: 22,
};

const ACTION_LABEL_KEYS = {
  subscription_renewal: 'dashboard.alertsScreen.actions.reviewCosts',
  health_insurance_expiry: 'dashboard.alertsScreen.actions.reviewHealth',
  insurance_renewal: 'dashboard.alertsScreen.actions.reviewCosts',
  mot_due: 'dashboard.alertsScreen.actions.reviewTransport',
  debt_high_apr: 'dashboard.alertsScreen.actions.reviewDebts',
  debt_promo_expiry: 'dashboard.alertsScreen.actions.reviewDebts',
  budget_deficit: 'dashboard.alertsScreen.actions.reviewBudget',
  overcommitted: 'dashboard.alertsScreen.actions.reviewBudget',
  many_streaming: 'dashboard.alertsScreen.actions.reviewSubscriptions',
};

const URGENCY_ORDER = { high: 0, medium: 1, low: 2 };

/**
 * @param {import('./alerts').AlertRecord} alert
 * @returns {string}
 */
export function getAlertActionLabelKey(alert) {
  return alert.actionLabelKey || ACTION_LABEL_KEYS[alert.type] || 'dashboard.alertsScreen.review';
}

/**
 * Insight-driven alerts for the dashboard action queue (not persisted).
 * @param {ReturnType<import('./insights').computeInsights>} insights
 * @param {import('./householdBudget').HouseholdFinancials} financials
 * @param {string} currencySymbol
 * @returns {import('./alerts').AlertRecord[]}
 */
function buildInsightAlerts(insights, financials, currencySymbol) {
  /** @type {import('./alerts').AlertRecord[]} */
  const synthetic = [];

  if (insights.flags.negativeSurplus) {
    synthetic.push({
      id: '__budget_deficit__',
      type: 'budget_deficit',
      urgency: 'high',
      relatedId: null,
      status: 'active',
      messageKey: 'dashboard.alertsScreen.types.negativeSurplus',
      messageParams: {
        amount: formatCurrency(Math.abs(insights.surplusMonthly), currencySymbol),
      },
      actionRoute: '/(app)/budget',
      actionLabelKey: ACTION_LABEL_KEYS.budget_deficit,
    });
  } else if (insights.flags.overcommitted) {
    synthetic.push({
      id: '__overcommitted__',
      type: 'overcommitted',
      urgency: 'high',
      relatedId: null,
      status: 'active',
      messageKey: 'dashboard.alertsScreen.types.overcommitted',
      messageParams: { pct: Math.round(insights.fixedCostRatio * 100) },
      actionRoute: '/(app)/budget',
      actionLabelKey: ACTION_LABEL_KEYS.overcommitted,
    });
  }

  if (insights.flags.manyStreaming) {
    synthetic.push({
      id: '__many_streaming__',
      type: 'many_streaming',
      urgency: 'medium',
      relatedId: null,
      status: 'active',
      messageKey: 'dashboard.alertsScreen.types.manyStreaming',
      messageParams: { count: insights.streamingCount },
      actionRoute: '/(app)/costs',
      actionLabelKey: ACTION_LABEL_KEYS.many_streaming,
    });
  }

  return synthetic;
}

/**
 * Prioritized action queue for the dashboard preview.
 * @param {import('./alerts').AlertRecord[]} alerts
 * @param {ReturnType<import('./insights').computeInsights>} insights
 * @param {import('./householdBudget').HouseholdFinancials} financials
 * @param {number} [limit=3]
 * @returns {import('./alerts').AlertRecord[]}
 */
export function buildDashboardActionQueue(alerts, insights, financials, limit = 3) {
  const currencySymbol = getCurrencySymbol(financials.currencyCode);
  const active = getActiveAlerts(alerts);
  const synthetic = buildInsightAlerts(insights, financials, currencySymbol);
  const syntheticTypes = new Set(synthetic.map((a) => a.type));

  const merged = [
    ...synthetic,
    ...active.filter((a) => {
      if (a.type === 'debt_high_apr' && syntheticTypes.has('overcommitted')) return true;
      return true;
    }),
  ];

  const seen = new Set();
  const deduped = merged.filter((alert) => {
    if (seen.has(alert.id)) return false;
    seen.add(alert.id);
    return true;
  });

  return deduped
    .sort((a, b) => {
      const urgencyDiff = (URGENCY_ORDER[a.urgency] ?? 9) - (URGENCY_ORDER[b.urgency] ?? 9);
      if (urgencyDiff !== 0) return urgencyDiff;
      return (TYPE_PRIORITY[a.type] ?? 50) - (TYPE_PRIORITY[b.type] ?? 50);
    })
    .slice(0, limit);
}
