import { buildLedgerCascade } from '../../lib/ledgerCascade';
import { GOAL_TYPES } from '../../lib/incomeGoals';

const baseFinancials = {
  totalIncome: 62000,
  fixedCosts: 30000,
  debtPayments: 4864,
  availableBudget: 27136,
  monthlyFlexible: 20000,
  effectiveMonthlyFlexible: 15000,
  deductSavingsGoal: true,
  budget: { committedBaseline: 40000 },
  income: {
    goalType: GOAL_TYPES.SAVE_MONEY,
    saveMode: 'ongoing',
    savingsMonthlyTarget: 5000,
  },
};

describe('buildLedgerCascade', () => {
  test('full cascade with deduct ON closes math', () => {
    const cascade = buildLedgerCascade(baseFinancials, { goalGap: null });
    expect(cascade.income).toBe(62000);
    expect(cascade.committed).toBe(34864);
    expect(cascade.available).toBe(27136);
    expect(cascade.saved).toBe(5000);
    expect(cascade.showSaved).toBe(true);
    expect(cascade.toSpend).toBe(15000);
    expect(cascade.unallocated).toBe(7136);
    expect(cascade.showUnallocated).toBe(true);
    expect(cascade.showUnallocatedSlider).toBe(true);
  });

  test('deduct OFF: saved informational, unallocated excludes saved', () => {
    const cascade = buildLedgerCascade(
      { ...baseFinancials, deductSavingsGoal: false, effectiveMonthlyFlexible: 20000 },
      { goalGap: null },
    );
    expect(cascade.savedIsInformational).toBe(true);
    expect(cascade.unallocated).toBe(27136 - 20000);
    expect(cascade.unallocated).toBe(7136);
  });

  test('hides unallocated when overcommitted', () => {
    const cascade = buildLedgerCascade(
      { ...baseFinancials, availableBudget: -500, monthlyFlexible: 0, effectiveMonthlyFlexible: 0 },
      { goalGap: null },
    );
    expect(cascade.isOvercommitted).toBe(true);
    expect(cascade.showUnallocated).toBe(false);
  });

  test('reduce costs goal shows cost reduction row not saved', () => {
    const cascade = buildLedgerCascade(
      {
        ...baseFinancials,
        income: { goalType: GOAL_TYPES.REDUCE_COSTS },
        fixedCosts: 28000,
        availableBudget: 29136,
      },
      { goalGap: null },
    );
    expect(cascade.showSaved).toBe(false);
    expect(cascade.showCostReduction).toBe(true);
    expect(cascade.costReduction).toBe(40000 - 32864);
  });

  test('slider stays visible when fully allocated to spending', () => {
    const cascade = buildLedgerCascade(
      {
        ...baseFinancials,
        monthlyFlexible: 27136,
        effectiveMonthlyFlexible: 22136,
        availableBudget: 27136,
      },
      { goalGap: null },
    );
    expect(cascade.unallocated).toBe(0);
    expect(cascade.showUnallocated).toBe(false);
    expect(cascade.showUnallocatedSlider).toBe(true);
  });

  test('slider hidden when available below minimum', () => {
    const cascade = buildLedgerCascade(
      {
        ...baseFinancials,
        availableBudget: 400,
        monthlyFlexible: 400,
        effectiveMonthlyFlexible: 400,
        fixedCosts: 61600,
      },
      { goalGap: null },
    );
    expect(cascade.available).toBe(400);
    expect(cascade.showUnallocatedSlider).toBe(false);
  });
});
