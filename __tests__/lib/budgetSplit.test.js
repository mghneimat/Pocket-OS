import {
  clampBudgetSpendingRatio,
  splitFlexibleBudget,
  resolveBudgetSpendingRatio,
  snapSpendingMonthly,
  getSpendingSteps,
} from '../../lib/budgetSplit';

describe('splitFlexibleBudget', () => {
  it('keeps full amount for spending at ratio 1', () => {
    expect(splitFlexibleBudget(10000, 1)).toEqual({
      spendingMonthly: 10000,
      savingsShift: 0,
      ratio: 1,
    });
  });

  it('shifts remainder to savings when ratio is reduced', () => {
    expect(splitFlexibleBudget(10000, 0.8)).toEqual({
      spendingMonthly: 8000,
      savingsShift: 2000,
      ratio: 0.8,
    });
  });

  it('snaps spending to 500 increments', () => {
    expect(splitFlexibleBudget(10300, 0.79)).toEqual({
      spendingMonthly: 8000,
      savingsShift: 2300,
      ratio: 8000 / 10300,
    });
  });
});

describe('snapSpendingMonthly', () => {
  it('snaps to nearest 500', () => {
    expect(snapSpendingMonthly(10000, 8240)).toBe(8000);
    expect(snapSpendingMonthly(10000, 8760)).toBe(9000);
  });

  it('includes full available amount as a step when not divisible by 500', () => {
    expect(getSpendingSteps(10300)).toEqual([
      0, 500, 1000, 1500, 2000, 2500, 3000, 3500, 4000, 4500,
      5000, 5500, 6000, 6500, 7000, 7500, 8000, 8500, 9000, 9500, 10000, 10300,
    ]);
    expect(snapSpendingMonthly(10300, 10200)).toBe(10300);
  });
});

describe('resolveBudgetSpendingRatio', () => {
  it('prefers explicit ratio when stored', () => {
    expect(resolveBudgetSpendingRatio({ budgetSpendingRatio: 0.75 }, 10000)).toBe(0.75);
  });

  it('infers ratio from legacy monthlyFlexible', () => {
    expect(resolveBudgetSpendingRatio({ monthlyFlexible: 6000 }, 10000)).toBe(0.6);
  });
});

describe('clampBudgetSpendingRatio', () => {
  it('clamps out-of-range values', () => {
    expect(clampBudgetSpendingRatio(1.5)).toBe(1);
    expect(clampBudgetSpendingRatio(-0.2)).toBe(0);
  });
});
