import { parseAlertDate } from './alerts';
import { toMonthly } from './finance';

/**
 * Calendar months from the start of `from`'s month through `end`'s month (inclusive).
 * @param {string} endDateStr - DD/MM/YYYY or MM/YYYY
 * @param {Date} [from=new Date()]
 * @returns {number|null}
 */
export function monthsRemainingUntil(endDateStr, from = new Date()) {
  const end = parseAlertDate(endDateStr);
  if (!end) return null;
  const startMonth = new Date(from.getFullYear(), from.getMonth(), 1);
  const endMonth = new Date(end.getFullYear(), end.getMonth(), 1);
  if (endMonth < startMonth) return 0;
  const months =
    (endMonth.getFullYear() - startMonth.getFullYear()) * 12
    + (endMonth.getMonth() - startMonth.getMonth())
    + 1;
  return Math.max(1, months);
}

/**
 * @param {import('./schema').HealthInsuranceMember & Record<string, unknown>} member
 * @returns {boolean}
 */
export function isPrepaidFixedContract(member) {
  return member?.endDateType === 'fixed' && member?.premiumPaidInFull === true;
}

/**
 * Monthly reserve from a lump-sum renewal payment and budget mode.
 * @param {import('./schema').HealthInsuranceMember & Record<string, unknown>} member
 * @param {number} lumpPremium
 * @returns {number|null}
 */
export function getPrepaidMonthlyReserve(member, lumpPremium) {
  const total = Number(lumpPremium) || 0;
  if (!total) return null;

  const months = monthsRemainingUntil(member.endDate);
  if (!months) return null;

  if (member.renewalBudgetMode === 'custom' && member.renewalCustomMonthly) {
    const custom = Number(member.renewalCustomMonthly);
    return custom > 0 ? custom : null;
  }

  if (member.renewalBudgetMode === 'skip') return null;
  return Math.ceil(total / months);
}

/**
 * Suggested monthly reserve for a lump-sum payment due at contract renewal.
 * @param {{ premium?: number|string, endDate?: string, savingsBalance?: number|string, now?: Date }} params
 */
export function computeRenewalSavingsPlan({
  premium,
  endDate,
  savingsBalance = 0,
  now = new Date(),
}) {
  const totalNeeded = Number(premium) || 0;
  const monthsRemaining = monthsRemainingUntil(endDate, now);
  if (!monthsRemaining || !totalNeeded) {
    return {
      monthsRemaining: monthsRemaining || 0,
      suggestedMonthly: 0,
      totalNeeded,
      shortfall: Math.max(0, totalNeeded - Number(savingsBalance || 0)),
      isTight: false,
    };
  }
  const suggestedMonthly = Math.ceil(totalNeeded / monthsRemaining);
  const savings = Number(savingsBalance) || 0;
  const shortfall = Math.max(0, totalNeeded - savings);
  const isTight = monthsRemaining <= 6 || savings < totalNeeded;
  return {
    monthsRemaining,
    suggestedMonthly,
    totalNeeded,
    shortfall,
    isTight,
  };
}

/**
 * Monthly amount to include in household fixed costs for one health member.
 * @param {import('./schema').HealthInsuranceMember & Record<string, unknown>} member
 * @returns {{ amount: number, frequency: string }|null}
 */
export function getHealthMemberBudgetLine(member) {
  if (!member?.confirmed || member.coverage === 'employer' || !member.premium) {
    return null;
  }

  const premium = Number(member.premium);
  if (!premium || premium <= 0) return null;

  if (isPrepaidFixedContract(member)) {
    if (member.renewalPlan === 'switch' && member.budgetForSwitch === true && member.switchPremiumAmount) {
      const monthlyReserve = getPrepaidMonthlyReserve(member, member.switchPremiumAmount);
      if (!monthlyReserve) return null;
      return { amount: monthlyReserve, frequency: 'monthly' };
    }

    if (member.renewalPlan === 'renew' && member.budgetForRenewal === true) {
      const monthlyReserve = getPrepaidMonthlyReserve(member, premium);
      if (!monthlyReserve) return null;
      return { amount: monthlyReserve, frequency: 'monthly' };
    }

    return null;
  }

  const freq = member.frequency || 'monthly';
  if (freq === 'custom' && member.customFrequencyMonths) {
    return {
      amount: premium / Number(member.customFrequencyMonths),
      frequency: 'monthly',
    };
  }
  return { amount: premium, frequency: freq };
}

/**
 * @param {import('./schema').HealthInsuranceMember & Record<string, unknown>} member
 * @returns {number}
 */
export function getHealthMemberMonthlyAmount(member) {
  const line = getHealthMemberBudgetLine(member);
  if (!line) return 0;
  return toMonthly(line.amount, line.frequency);
}
