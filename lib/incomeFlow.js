/**
 * Resolve the first income sub-step from occupation answers.
 * @param {Object} options
 * @param {boolean} options.isEditMode
 * @param {boolean} options.hasPartner
 * @param {string} [options.userOccupation]
 * @param {string} [options.partnerOccupation]
 * @returns {'q5'|'q5a'|'q5b'}
 */
export function resolveInitialIncomeStep({
  isEditMode,
  hasPartner,
  userOccupation,
  partnerOccupation,
}) {
  if (isEditMode) return 'q5';

  const userNotWorking = userOccupation === 'notWorking';
  const partnerNotWorking = partnerOccupation === 'notWorking';

  if (hasPartner && userNotWorking && !partnerNotWorking) return 'q5a';
  if (userNotWorking && (!hasPartner || partnerNotWorking)) return 'q5b';
  return 'q5';
}

/**
 * Whether user or partner salary was entered before the other-income step.
 * @param {Object} options
 * @param {boolean} options.isNotWorking
 * @param {string|number|null} options.incomeAmount
 * @param {boolean} options.hasPartner
 * @param {boolean} options.partnerIsNotWorking
 * @param {string|number|null} options.partnerIncomeAmount
 * @returns {boolean}
 */
export function hasPriorSalaryIncome({
  isNotWorking,
  incomeAmount,
  hasPartner,
  partnerIsNotWorking,
  partnerIncomeAmount,
}) {
  const userIncome = !isNotWorking && parseFloat(incomeAmount) > 0;
  const partnerIncome = hasPartner && !partnerIsNotWorking && parseFloat(partnerIncomeAmount) > 0;
  return userIncome || partnerIncome;
}

/**
 * @param {Array<{ visible?: boolean, amount?: string|number }>} rows
 * @returns {Array<{ visible?: boolean, amount?: string|number }>}
 */
export function getValidOtherIncomeRows(rows) {
  return (rows || []).filter((row) => row.visible !== false && parseFloat(row.amount) > 0);
}

/**
 * Validate continue on the other-income step.
 * @returns {'validationNoIncome'|'validationOtherAmount'|null}
 */
export function validateOtherIncomeContinue({
  hasPriorSalary,
  hasOtherIncome,
  otherIncomeRows,
}) {
  if (hasPriorSalary) {
    if (hasOtherIncome === true && getValidOtherIncomeRows(otherIncomeRows).length === 0) {
      return 'validationOtherAmount';
    }
    return null;
  }

  if (hasOtherIncome !== true) {
    return 'validationNoIncome';
  }

  if (getValidOtherIncomeRows(otherIncomeRows).length === 0) {
    return 'validationOtherAmount';
  }

  return null;
}

/**
 * Previous step when pressing back, or 'splash' to leave the section.
 * @param {Object} options
 * @param {string} options.step
 * @param {boolean} options.hasPartner
 * @param {boolean} options.isNotWorking
 * @param {boolean} options.partnerIsNotWorking
 * @returns {string}
 */
export function getIncomeBackTarget({
  step,
  hasPartner,
  isNotWorking,
  partnerIsNotWorking,
}) {
  const skippedToPartner = hasPartner && isNotWorking && !partnerIsNotWorking;
  const skippedToOther = isNotWorking && (!hasPartner || partnerIsNotWorking);

  if (step === 'q5a') {
    return skippedToPartner ? 'splash' : 'q5';
  }
  if (step === 'q5b') {
    if (skippedToPartner) return 'q5a';
    if (skippedToOther) return 'splash';
    if (hasPartner && !partnerIsNotWorking) return 'q5a';
    return 'q5';
  }
  return 'splash';
}
