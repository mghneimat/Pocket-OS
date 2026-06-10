import { computeFlexibleRemaining } from '../../lib/ledgerLeft';

describe('computeFlexibleRemaining', () => {
  it('subtracts month spend from flexible budget plus rollover', () => {
    const result = computeFlexibleRemaining({
      monthlyFlexible: 30000,
      effectiveMonthlyFlexible: 30000,
      budget: { rolloverBalance: 2000 },
      dailyLogs: [
        { date: '2026-06-08', spent: 5000 },
        { date: '2026-06-01', spent: 3000 },
        { date: '2026-05-30', spent: 9999 },
      ],
    }, new Date(2026, 5, 8));

    expect(result.spendingPool).toBe(32000);
    expect(result.spent).toBe(8000);
    expect(result.left).toBe(24000);
  });

  it('returns negative left when over budget', () => {
    const result = computeFlexibleRemaining({
      monthlyFlexible: 10000,
      budget: { rolloverBalance: 0 },
      dailyLogs: [{ date: '2026-06-08', spent: 12000 }],
    }, new Date(2026, 5, 8));

    expect(result.left).toBe(-2000);
  });
});
