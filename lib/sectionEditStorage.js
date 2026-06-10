/** @type {Record<string, string>} */
export const SECTION_STORAGE_KEYS = {
  income: 'pocketos_income',
  housing: 'pocketos_housing',
  transport: 'pocketos_transport',
  health: 'pocketos_health',
  'children-costs': 'pocketos_children_costs',
  pets: 'pocketos_pets',
  subscriptions: 'pocketos_subscriptions',
  'other-costs': 'pocketos_other_costs',
  debts: 'pocketos_debts',
  budget: 'pocketos_budget',
};

export function parseAmount(value) {
  if (value === '' || value == null) return null;
  const n = parseFloat(String(value).replace(/\s/g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

export function amountToString(value) {
  if (value == null || value === '') return '';
  return String(value);
}
