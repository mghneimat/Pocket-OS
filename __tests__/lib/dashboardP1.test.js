import { getHeadlineAction } from '../../lib/insightActions';
import { buildDashboardActionQueue } from '../../lib/dashboardAlerts';

describe('getHeadlineAction', () => {
  const base = {
    flags: {},
    highAprDebts: [],
    topCategories: [],
    streamingCount: 0,
  };

  it('routes overcommitted households to budget', () => {
    expect(getHeadlineAction({ ...base, flags: { overcommitted: true } }).route).toBe('budget');
  });

  it('routes high APR debts to expenses', () => {
    expect(getHeadlineAction({
      ...base,
      highAprDebts: [{ idx: 0 }],
    }).route).toBe('costs');
  });

  it('defaults to summary when balanced', () => {
    expect(getHeadlineAction(base).route).toBe('summary');
  });
});

describe('buildDashboardActionQueue', () => {
  const financials = { currencyCode: 'CZK', totalIncome: 50000, monthlyFlexible: 10000 };

  it('prioritizes budget deficit above medium alerts', () => {
    const insights = {
      flags: { negativeSurplus: true },
      surplusMonthly: -5000,
      fixedCostRatio: 0.9,
      streamingCount: 4,
    };
    const alerts = [{
      id: 'sub-0',
      type: 'subscription_renewal',
      urgency: 'medium',
      status: 'active',
      messageKey: 'x',
    }];
    const queue = buildDashboardActionQueue(alerts, insights, financials, 3);
    expect(queue[0].type).toBe('budget_deficit');
  });
});
