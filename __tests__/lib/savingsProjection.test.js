import {
  buildSavingsProjection,
  getMonthlyPlannedSavings,
  monthsUntilDate,
} from '../../lib/savingsProjection';

describe('getMonthlyPlannedSavings', () => {
  it('sums budget shift and goal reservation', () => {
    const total = getMonthlyPlannedSavings(
      {
        budgetSavingsShift: 2000,
        deductSavingsGoal: true,
        income: { goalType: 'saveMoney', saveMode: 'ongoing', savingsMonthlyTarget: 3000 },
      },
      { monthlyRequired: 1500 },
    );
    expect(total).toBe(3500);
  });
});

describe('buildSavingsProjection', () => {
  it('projects balance forward using monthly inflow', () => {
    const projection = buildSavingsProjection({
      financials: {
        income: { savingsBalance: 10000 },
        budgetSavingsShift: 2000,
        deductSavingsGoal: false,
      },
      goalGap: null,
      monthsAhead: 3,
      now: new Date(2026, 5, 1),
    });
    expect(projection.points).toHaveLength(4);
    expect(projection.points[3].balance).toBe(16000);
  });

  it('stops at target savings goal amount', () => {
    const goalDate = new Date(2026, 8, 1);
    const projection = buildSavingsProjection({
      financials: {
        income: {
          savingsBalance: 8000,
          goalType: 'saveMoney',
          saveMode: 'target',
          goalAmount: 10000,
          goalDate: `01/09/${goalDate.getFullYear()}`,
        },
        budgetSavingsShift: 2000,
        deductSavingsGoal: false,
      },
      goalGap: { monthlyRequired: 1000 },
      monthsAhead: 12,
      now: new Date(2026, 5, 1),
    });
    const last = projection.points[projection.points.length - 1];
    expect(last.balance).toBe(10000);
    expect(last.atGoal).toBe(true);
  });
});

describe('monthsUntilDate', () => {
  it('returns months between dates', () => {
    const from = new Date(2026, 5, 1);
    const to = new Date(2026, 8, 1);
    expect(monthsUntilDate(to, from)).toBe(3);
  });
});
