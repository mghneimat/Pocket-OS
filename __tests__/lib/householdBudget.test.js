import { aggregateHouseholdCosts } from '../../lib/householdBudget';

const t = (key, params) => {
  if (key === 'onboarding.budget.familyContribution' && params?.n) {
    return `Family contribution ${params.n}`;
  }
  if (key.startsWith('onboarding.budget.q14.cat.')) {
    return key.split('.').pop();
  }
  if (key.startsWith('dashboard.recurring.')) {
    return key.split('.').pop();
  }
  return key;
};

describe('aggregateHouseholdCosts', () => {
  it('does not include family contributions for renting households', () => {
    const { allCosts } = aggregateHouseholdCosts({
      housing: {
        type: 'renting',
        rent: 10000,
        contributesToFamily: true,
        familyContributionRows: [{ amount: 10000, description: null }],
      },
      household: {},
    }, t);

    expect(allCosts.some((c) => c.label?.includes('Family contribution'))).toBe(false);
  });

  it('labels user health premium as self insurance, not child', () => {
    const { allCosts, byCategory } = aggregateHouseholdCosts({
      health: {
        user: { confirmed: true, coverage: 'private', premium: 1000, frequency: 'monthly' },
      },
      household: {},
    }, t);

    const healthItems = byCategory.find((c) => c.category === 'health')?.items || [];
    expect(healthItems).toHaveLength(1);
    expect(healthItems[0].label).toBe('healthSelf');
    expect(allCosts).toHaveLength(1);
  });

  it('amortizes prepaid health renewal over months remaining, not annual frequency', () => {
    const { byCategory } = aggregateHouseholdCosts({
      health: {
        user: {
          confirmed: true,
          coverage: 'private',
          premium: 12000,
          frequency: 'annual',
          endDateType: 'fixed',
          endDate: '12/2026',
          premiumPaidInFull: true,
          renewalPlan: 'renew',
          budgetForRenewal: true,
          renewalBudgetMode: 'custom',
          renewalCustomMonthly: 1500,
        },
      },
      household: {},
    }, t);

    const healthItems = byCategory.find((c) => c.category === 'health')?.items || [];
    expect(healthItems).toHaveLength(1);
    expect(healthItems[0].amount).toBe(1500);
    expect(healthItems[0].frequency).toBe('monthly');
  });

  it('excludes prepaid health premium when renewal budgeting is skipped', () => {
    const { byCategory } = aggregateHouseholdCosts({
      health: {
        user: {
          confirmed: true,
          coverage: 'private',
          premium: 12000,
          frequency: 'annual',
          endDateType: 'fixed',
          endDate: '12/2026',
          premiumPaidInFull: true,
          renewalPlan: 'renew',
          budgetForRenewal: false,
          renewalBudgetMode: 'skip',
        },
      },
      household: {},
    }, t);

    const healthItems = byCategory.find((c) => c.category === 'health')?.items || [];
    expect(healthItems).toHaveLength(0);
  });

  it('ignores stale child health entries when household has no children', () => {
    const { byCategory } = aggregateHouseholdCosts({
      health: {
        user: { confirmed: true, coverage: 'private', premium: 500, frequency: 'monthly' },
        child_0: { confirmed: true, coverage: 'private', premium: 1000, frequency: 'monthly' },
      },
      household: { children: [] },
    }, t);

    const healthItems = byCategory.find((c) => c.category === 'health')?.items || [];
    expect(healthItems).toHaveLength(1);
    expect(healthItems[0].amount).toBe(500);
  });
});
