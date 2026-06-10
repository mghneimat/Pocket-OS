import {
  GOAL_TYPES,
  SAVE_MODES,
  buildIncomeGoalPayload,
  getMonthlySavingsReservation,
  hasTargetSavingsGoal,
  normalizeIncomeGoalFields,
  restoreGoalSelection,
} from '../../lib/incomeGoals';

describe('normalizeIncomeGoalFields', () => {
  it('maps legacy target goal', () => {
    expect(normalizeIncomeGoalFields({
      hasGoal: true,
      goalAmount: 250000,
      goalDate: '01/2028',
    })).toEqual({ goalType: GOAL_TYPES.SAVE_MONEY, saveMode: SAVE_MODES.TARGET });
  });

  it('maps legacy ongoing monthly saving', () => {
    expect(normalizeIncomeGoalFields({
      savingsMonthlyTarget: 5000,
      hasGoal: false,
    })).toEqual({ goalType: GOAL_TYPES.SAVE_MONEY, saveMode: SAVE_MODES.ONGOING });
  });
});

describe('buildIncomeGoalPayload', () => {
  it('stores ongoing monthly target only for ongoing mode', () => {
    const payload = buildIncomeGoalPayload({
      goalType: GOAL_TYPES.SAVE_MONEY,
      saveMode: SAVE_MODES.ONGOING,
      savingsBalance: '10000',
      savingsMonthlyTarget: '3000',
      goalDescription: '',
      goalAmount: '',
      goalDate: '',
    });

    expect(payload.savingsMonthlyTarget).toBe(3000);
    expect(payload.goalAmount).toBeNull();
    expect(payload.hasGoal).toBe(false);
  });

  it('clears save fields for reduce-costs goal', () => {
    const payload = buildIncomeGoalPayload({
      goalType: GOAL_TYPES.REDUCE_COSTS,
      saveMode: null,
      savingsBalance: '10000',
      savingsMonthlyTarget: '3000',
      goalDescription: 'Car',
      goalAmount: '250000',
      goalDate: '01/2028',
    });

    expect(payload.goalType).toBe(GOAL_TYPES.REDUCE_COSTS);
    expect(payload.savingsMonthlyTarget).toBeNull();
    expect(payload.goalAmount).toBeNull();
  });
});

describe('getMonthlySavingsReservation', () => {
  it('uses ongoing monthly target', () => {
    expect(getMonthlySavingsReservation({
      goalType: GOAL_TYPES.SAVE_MONEY,
      saveMode: SAVE_MODES.ONGOING,
      savingsMonthlyTarget: 4000,
    }, null)).toBe(4000);
  });

  it('uses computed gap for target goals', () => {
    expect(getMonthlySavingsReservation({
      goalType: GOAL_TYPES.SAVE_MONEY,
      saveMode: SAVE_MODES.TARGET,
      goalAmount: 100000,
      goalDate: '01/2028',
    }, { monthlyRequired: 8500 })).toBe(8500);
  });
});

describe('restoreGoalSelection', () => {
  it('restores explicit goal type from storage', () => {
    expect(restoreGoalSelection({
      goalType: GOAL_TYPES.REDUCE_AND_SAVE,
      saveMode: SAVE_MODES.TARGET,
    })).toEqual({
      goalType: GOAL_TYPES.REDUCE_AND_SAVE,
      saveMode: SAVE_MODES.TARGET,
    });
  });
});

describe('hasTargetSavingsGoal', () => {
  it('requires amount and date', () => {
    expect(hasTargetSavingsGoal({
      goalType: GOAL_TYPES.SAVE_MONEY,
      saveMode: SAVE_MODES.TARGET,
      goalAmount: 250000,
      goalDate: '06/2028',
    })).toBe(true);
  });
});
