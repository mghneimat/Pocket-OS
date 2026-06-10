/** @typedef {'reduceCosts'|'saveMoney'|'reduceAndSave'} GoalType */
/** @typedef {'target'|'ongoing'} SaveMode */

export const GOAL_TYPES = {
  REDUCE_COSTS: 'reduceCosts',
  SAVE_MONEY: 'saveMoney',
  REDUCE_AND_SAVE: 'reduceAndSave',
};

export const SAVE_MODES = {
  TARGET: 'target',
  ONGOING: 'ongoing',
};

/**
 * @param {GoalType|null|undefined} goalType
 * @returns {boolean}
 */
export function goalTypeIncludesSaving(goalType) {
  return goalType === GOAL_TYPES.SAVE_MONEY || goalType === GOAL_TYPES.REDUCE_AND_SAVE;
}

/**
 * Map legacy income payloads to goalType/saveMode.
 * @param {object|null|undefined} inc
 * @returns {{ goalType: GoalType|null, saveMode: SaveMode|null }}
 */
export function normalizeIncomeGoalFields(inc) {
  if (!inc) return { goalType: null, saveMode: null };
  if (inc.goalType) {
    return { goalType: inc.goalType, saveMode: inc.saveMode || null };
  }
  if (inc.hasGoal && inc.goalAmount) {
    return { goalType: GOAL_TYPES.SAVE_MONEY, saveMode: SAVE_MODES.TARGET };
  }
  if (Number(inc.savingsMonthlyTarget) > 0 && !inc.hasGoal) {
    return { goalType: GOAL_TYPES.SAVE_MONEY, saveMode: SAVE_MODES.ONGOING };
  }
  return { goalType: null, saveMode: null };
}

/**
 * @param {object|null|undefined} inc
 * @returns {boolean}
 */
export function hasFinancialGoal(inc) {
  return Boolean(normalizeIncomeGoalFields(inc).goalType);
}

/**
 * @param {object|null|undefined} inc
 * @returns {boolean}
 */
export function hasTargetSavingsGoal(inc) {
  const { goalType, saveMode } = normalizeIncomeGoalFields(inc);
  return goalTypeIncludesSaving(goalType)
    && saveMode === SAVE_MODES.TARGET
    && Number(inc?.goalAmount) > 0
    && Boolean(inc?.goalDate);
}

/**
 * @param {object|null|undefined} inc
 * @returns {boolean}
 */
export function hasOngoingSavingsGoal(inc) {
  const { goalType, saveMode } = normalizeIncomeGoalFields(inc);
  return goalTypeIncludesSaving(goalType)
    && saveMode === SAVE_MODES.ONGOING
    && Number(inc?.savingsMonthlyTarget) > 0;
}

/**
 * Monthly amount to reserve from flexible spending.
 * @param {object|null|undefined} inc
 * @param {{ monthlyRequired?: number }|null|undefined} goalGap
 * @returns {number}
 */
export function getMonthlySavingsReservation(inc, goalGap) {
  const { goalType, saveMode } = normalizeIncomeGoalFields(inc);
  if (!goalTypeIncludesSaving(goalType)) return 0;
  if (saveMode === SAVE_MODES.ONGOING) return Number(inc?.savingsMonthlyTarget) || 0;
  if (saveMode === SAVE_MODES.TARGET) return goalGap?.monthlyRequired || 0;
  return 0;
}

/**
 * @param {object} fields
 * @returns {object}
 */
export function buildIncomeGoalPayload({
  goalType,
  saveMode,
  savingsBalance,
  savingsMonthlyTarget,
  goalDescription,
  goalAmount,
  goalDate,
}) {
  const includesSaving = goalTypeIncludesSaving(goalType);
  const effectiveSaveMode = includesSaving ? saveMode : null;
  const parsedTarget = savingsMonthlyTarget ? parseFloat(savingsMonthlyTarget) : null;
  const parsedAmount = goalAmount ? parseFloat(goalAmount) : null;

  return {
    goalType: goalType || null,
    saveMode: effectiveSaveMode,
    savingsBalance: savingsBalance ? parseFloat(savingsBalance) : null,
    savingsMonthlyTarget: effectiveSaveMode === SAVE_MODES.ONGOING && parsedTarget
      ? parsedTarget
      : null,
    goalDescription: effectiveSaveMode === SAVE_MODES.TARGET ? (goalDescription || null) : null,
    goalAmount: effectiveSaveMode === SAVE_MODES.TARGET && parsedAmount ? parsedAmount : null,
    goalDate: effectiveSaveMode === SAVE_MODES.TARGET ? (goalDate || null) : null,
    hasGoal: includesSaving && effectiveSaveMode === SAVE_MODES.TARGET && Boolean(parsedAmount),
  };
}

/**
 * @param {object|null|undefined} saved
 * @returns {{ goalType: GoalType|null, saveMode: SaveMode|null }}
 */
export function restoreGoalSelection(saved) {
  if (!saved) return { goalType: null, saveMode: null };
  if (saved.goalType) {
    return { goalType: saved.goalType, saveMode: saved.saveMode || null };
  }
  if (saved.hasGoal && saved.goalAmount) {
    return { goalType: GOAL_TYPES.SAVE_MONEY, saveMode: SAVE_MODES.TARGET };
  }
  if (Number(saved.savingsMonthlyTarget) > 0) {
    return { goalType: GOAL_TYPES.SAVE_MONEY, saveMode: SAVE_MODES.ONGOING };
  }
  return { goalType: null, saveMode: null };
}
