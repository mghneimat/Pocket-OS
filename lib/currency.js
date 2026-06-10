/**
 * ISO currency code → display symbol (Czech locale conventions where applicable).
 */
const CURRENCY_SYMBOLS = {
  CZK: 'Kč',
  EUR: '€',
  USD: '$',
  GBP: '£',
  PLN: 'zł',
  HUF: 'Ft',
  CHF: 'Fr',
  SEK: 'kr',
  NOK: 'kr',
  DKK: 'kr',
  RON: 'lei',
  BGN: 'лв',
  HRK: 'kn',
  RSD: 'дин',
  CAD: 'CA$',
  AUD: 'A$',
  JPY: '¥',
  CNY: '¥',
  INR: '₹',
  RUB: '₽',
  UAH: '₴',
  NZD: 'NZ$',
  KRW: '₩',
};

/**
 * @param {string} [code] - ISO 4217 code (e.g. CZK)
 * @returns {string} Display symbol (e.g. Kč)
 */
export function getCurrencySymbol(code) {
  if (!code) return 'Kč';
  const upper = String(code).toUpperCase();
  return CURRENCY_SYMBOLS[upper] || code;
}
