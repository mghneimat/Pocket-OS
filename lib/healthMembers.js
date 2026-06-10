/**
 * Resolve which health storage keys belong to the current household profile.
 * @param {string} key
 * @param {object|null|undefined} household
 * @returns {boolean}
 */
export function isActiveHealthMemberKey(key, household) {
  if (key === 'user' || key === 'self') return true;
  if (key === 'partner') return Boolean(household?.partnerName);
  if (key.startsWith('child_')) {
    const idx = parseInt(key.replace('child_', ''), 10);
    return Number.isFinite(idx) && idx >= 0 && idx < (household?.children?.length || 0);
  }
  return false;
}

/**
 * Localized label for a health insurance line item.
 * @param {string} key
 * @param {object|null|undefined} household
 * @param {(translationKey: string) => string} t
 * @returns {string}
 */
export function getHealthMemberLabel(key, household, t) {
  if (key === 'user' || key === 'self') return t('dashboard.recurring.healthSelf');
  if (key === 'partner') return t('dashboard.recurring.healthPartner');
  if (key.startsWith('child_')) return t('dashboard.recurring.healthChild');
  return key;
}
