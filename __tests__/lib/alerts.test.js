import { parseAlertDate, daysUntil, scanAlerts } from '../../lib/alerts';

const t = (key, params = {}) => {
  let s = key;
  Object.entries(params).forEach(([k, v]) => {
    s = s.replace(`{{${k}}}`, String(v));
  });
  return s;
};

describe('parseAlertDate', () => {
  test('parses DD/MM/YYYY', () => {
    const d = parseAlertDate('15/06/2026');
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(5);
    expect(d.getDate()).toBe(15);
  });
});

describe('scanAlerts', () => {
  test('flags subscription renewal within 7 days', () => {
    const soon = new Date();
    soon.setDate(soon.getDate() + 3);
    const day = String(soon.getDate()).padStart(2, '0');
    const month = String(soon.getMonth() + 1).padStart(2, '0');
    const alerts = scanAlerts({
      subs: [{ name: 'netflix', renewalDate: `${day}/${month}/${soon.getFullYear()}` }],
      health: {},
      debts: [],
      transport: {},
    }, t);
    expect(alerts.some((a) => a.type === 'subscription_renewal')).toBe(true);
  });

  test('flags high APR debt', () => {
    const alerts = scanAlerts({
      subs: [],
      health: {},
      debts: [{ type: 'creditCard', apr: '24', balance: '10000', minPayment: '300' }],
      transport: {},
    }, t);
    expect(alerts.some((a) => a.type === 'debt_high_apr')).toBe(true);
  });
});

describe('daysUntil', () => {
  test('returns positive days for future date', () => {
    const from = new Date(2026, 5, 1);
    const target = new Date(2026, 5, 8);
    expect(daysUntil(target, from)).toBe(7);
  });
});
