import { displayBudget, formatCurrency } from '../../lib/finance';

/** Format a monthly amount at the user's chosen dashboard frequency. */
export function formatDashboardAmount(monthlyAmount, frequency, currency, daysInMonth) {
  const amount = displayBudget(monthlyAmount, frequency, daysInMonth);
  return formatCurrency(amount, currency);
}
