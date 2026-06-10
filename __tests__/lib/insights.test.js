import { computeInsights, computeGoalGap, getHeadlineInsight } from '../../lib/insights';

const t = (key, params = {}) => {
  let s = key;
  Object.entries(params).forEach(([k, v]) => {
    s = s.replace(`{{${k}}}`, String(v));
  });
  return s;
};

const baseFinancials = {
  totalIncome: 50000,
  fixedCosts: 30000,
  debtPayments: 5000,
  monthlyFlexible: 10000,
  availableBudget: 15000,
  income: { hasGoal: false },
  debts: [],
  byCategory: [
    { category: 'housing', label: 'Housing', items: [{ label: 'Rent', amount: 30000, frequency: 'monthly' }] },
    { category: 'subscriptions', label: 'Subscriptions', items: [{ label: 'Netflix', amount: 500, frequency: 'monthly' }] },
  ],
  sections: {
    subs: [
      { name: 'netflix', cost: '500', frequency: 'monthly' },
      { name: 'spotify', cost: '200', frequency: 'monthly' },
      { name: 'disneyPlus', cost: '300', frequency: 'monthly' },
    ],
    health: {},
    transport: {},
  },
  recurringCommitments: [],
};

describe('computeInsights', () => {
  test('calculates fixed cost ratio', () => {
    const insights = computeInsights({
      ...baseFinancials,
      recurringCommitments: [{ monthlyAmount: 1000 }],
    });
    expect(insights.fixedCostRatio).toBeCloseTo(0.7);
    expect(insights.topCategories[0].key).toBe('housing');
  });

  test('flags many streaming services', () => {
    const insights = computeInsights(baseFinancials);
    expect(insights.flags.manyStreaming).toBe(true);
    expect(insights.streamingCount).toBe(3);
  });
});

describe('computeGoalGap', () => {
  test('returns null when no goal', () => {
    expect(computeGoalGap(baseFinancials)).toBeNull();
  });

  test('detects unachievable goal', () => {
    const future = new Date();
    future.setMonth(future.getMonth() + 6);
    const day = String(future.getDate()).padStart(2, '0');
    const month = String(future.getMonth() + 1).padStart(2, '0');
    const fin = {
      ...baseFinancials,
      monthlyFlexible: 1000,
      income: {
        hasGoal: true,
        goalAmount: 50000,
        goalDate: `${day}/${month}/${future.getFullYear()}`,
        savingsBalance: 0,
      },
    };
    const gap = computeGoalGap(fin);
    expect(gap.achievable).toBe(false);
    expect(gap.monthlyRequired).toBeGreaterThan(1000);
  });
});

describe('getHeadlineInsight', () => {
  test('returns headline key text', () => {
    const insights = computeInsights(baseFinancials);
    const text = getHeadlineInsight(insights, t);
    expect(text).toContain('dashboard.insights.headline');
  });
});
