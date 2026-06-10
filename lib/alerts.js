import { getData, setData } from './storage';
import { parseStoredDate } from './datePicker';
import { EDIT_SECTION_ROUTES } from './sectionEditPaths';

/**
 * @typedef {Object} AlertRecord
 * @property {string} id
 * @property {string} type
 * @property {'low'|'medium'|'high'} urgency
 * @property {string|null} relatedId
 * @property {'active'|'snoozed'|'dismissed'} status
 * @property {string|null} snoozedUntil
 * @property {string} messageKey
 * @property {Record<string, string|number>} [messageParams]
 * @property {string} [actionRoute]
 * @property {string} [editRoute]
 */

/**
 * @param {string} dateStr - DD/MM/YYYY or MM/YYYY
 * @returns {Date|null}
 */
export function parseAlertDate(dateStr) {
  if (!dateStr) return null;
  const { day, month, year } = parseStoredDate(dateStr, dateStr.split('/').length === 3);
  if (!month || !year) return null;
  return new Date(year, month - 1, day || 1);
}

/**
 * @param {Date} target
 * @param {Date} [from=new Date()]
 * @returns {number}
 */
export function daysUntil(target, from = new Date()) {
  const start = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const end = new Date(target.getFullYear(), target.getMonth(), target.getDate());
  return Math.round((end - start) / (1000 * 60 * 60 * 24));
}

/**
 * Scan onboarding payloads and produce alert records (not yet merged with user dismissals).
 * @param {Object} raw
 * @param {(key: string, params?: object) => string} t
 * @returns {AlertRecord[]}
 */
export function scanAlerts(raw, t) {
  const {
    subs = [],
    health = {},
    debts = [],
    transport = {},
  } = raw;

  const alerts = [];
  const now = new Date();

  subs.forEach((sub, idx) => {
    const renewal = parseAlertDate(sub.renewalDate);
    if (!renewal) return;
    const days = daysUntil(renewal, now);
    if (days < 0 || days > 7) return;
    const transKey = `onboarding.subscriptions.q11.services.${sub.name}`;
    const translated = t(transKey);
    const name = translated !== transKey ? translated : (sub.name || t('dashboard.alertsScreen.fallback.subscription'));
    alerts.push({
      id: `subscription_renewal-${idx}`,
      type: 'subscription_renewal',
      urgency: days <= 3 ? 'high' : 'medium',
      relatedId: String(idx),
      status: 'active',
      messageKey: 'dashboard.alertsScreen.types.subscriptionRenewal',
      messageParams: { name, days },
      actionRoute: '/(app)/costs',
      editRoute: EDIT_SECTION_ROUTES.subscriptions,
    });
  });

  Object.entries(health).forEach(([key, member]) => {
    if (!member?.confirmed || !member.endDate) return;
    const end = parseAlertDate(member.endDate);
    if (!end) return;
    const days = daysUntil(end, now);
    if (days < 0 || days > 30) return;
    const memberLabel = key === 'self'
      ? t('dashboard.recurring.healthSelf')
      : key === 'partner'
        ? t('dashboard.recurring.healthPartner')
        : t('dashboard.recurring.healthChild');
    alerts.push({
      id: `health_expiry-${key}`,
      type: 'health_insurance_expiry',
      urgency: days <= 14 ? 'high' : 'medium',
      relatedId: key,
      status: 'active',
      messageKey: 'dashboard.alertsScreen.types.healthExpiry',
      messageParams: { member: memberLabel, days },
      actionRoute: '/(app)/costs',
      editRoute: EDIT_SECTION_ROUTES.health,
    });
  });

  if (transport?.hasVehicle && transport.vehicles) {
    transport.vehicles.forEach((v, vi) => {
      const mot = parseAlertDate(v.motDate);
      if (mot) {
        const days = daysUntil(mot, now);
        if (days >= 0 && days <= 30) {
          alerts.push({
            id: `mot_due-${vi}`,
            type: 'mot_due',
            urgency: days <= 7 ? 'high' : 'medium',
            relatedId: String(vi),
            status: 'active',
            messageKey: 'dashboard.alertsScreen.types.motDue',
            messageParams: { days },
            actionRoute: '/(app)/alerts',
            editRoute: EDIT_SECTION_ROUTES.transport,
          });
        }
      }
      const insRenewal = parseAlertDate(v.insuranceRenewalDate);
      if (insRenewal) {
        const days = daysUntil(insRenewal, now);
        if (days >= 0 && days <= 30) {
          alerts.push({
            id: `insurance_renewal-${vi}`,
            type: 'insurance_renewal',
            urgency: days <= 14 ? 'high' : 'medium',
            relatedId: String(vi),
            status: 'active',
            messageKey: 'dashboard.alertsScreen.types.insuranceRenewal',
            messageParams: { days },
            actionRoute: '/(app)/costs',
            editRoute: EDIT_SECTION_ROUTES.transport,
          });
        }
      }
    });
  }

  debts.forEach((debt, idx) => {
    const apr = parseFloat(debt.apr || 0);
    if (apr > 20) {
      const typeKey = `onboarding.debts.q13a.${debt.type || 'other'}`;
      const translated = t(typeKey);
      const name = translated !== typeKey ? translated : t('dashboard.alertsScreen.fallback.debt');
      alerts.push({
        id: `high_apr-${idx}`,
        type: 'debt_high_apr',
        urgency: 'high',
        relatedId: String(idx),
        status: 'active',
        messageKey: 'dashboard.alertsScreen.types.highApr',
        messageParams: { name, apr },
        actionRoute: '/(app)/costs',
        editRoute: EDIT_SECTION_ROUTES.debts,
      });
    }

    const promoEnd = parseAlertDate(debt.promoEndDate);
    if (promoEnd) {
      const days = daysUntil(promoEnd, now);
      if (days >= 0 && days <= 30) {
        alerts.push({
          id: `promo_expiry-${idx}`,
          type: 'debt_promo_expiry',
          urgency: days <= 14 ? 'high' : 'medium',
          relatedId: String(idx),
          status: 'active',
          messageKey: 'dashboard.alertsScreen.types.promoExpiry',
          messageParams: { days },
          actionRoute: '/(app)/alerts',
          editRoute: EDIT_SECTION_ROUTES.debts,
        });
      }
    }
  });

  const urgencyOrder = { high: 0, medium: 1, low: 2 };
  return alerts.sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency]);
}

/**
 * Merge scanned alerts with stored dismiss/snooze state and persist.
 * @param {Object} raw
 * @param {(key: string, params?: object) => string} t
 * @returns {Promise<AlertRecord[]>}
 */
export async function syncAlerts(raw, t) {
  const scanned = scanAlerts(raw, t);
  const stored = (await getData('pocketos_alerts')) || [];
  const storedById = Object.fromEntries(stored.map((a) => [a.id, a]));
  const now = new Date();

  const merged = scanned.map((alert) => {
    const prev = storedById[alert.id];
    if (!prev) return alert;
    if (prev.status === 'dismissed') return { ...alert, status: 'dismissed' };
    if (prev.status === 'snoozed' && prev.snoozedUntil) {
      const until = new Date(prev.snoozedUntil);
      if (until > now) return { ...alert, status: 'snoozed', snoozedUntil: prev.snoozedUntil };
    }
    return { ...alert, status: 'active' };
  });

  await setData('pocketos_alerts', merged);
  return merged;
}

/**
 * @param {AlertRecord[]} alerts
 * @param {number} [limit]
 * @returns {AlertRecord[]}
 */
export function getActiveAlerts(alerts, limit) {
  const active = alerts.filter((a) => a.status === 'active');
  return limit ? active.slice(0, limit) : active;
}

/**
 * @param {string} alertId
 */
export async function dismissAlert(alertId) {
  const stored = (await getData('pocketos_alerts')) || [];
  const updated = stored.map((a) => (
    a.id === alertId ? { ...a, status: 'dismissed' } : a
  ));
  await setData('pocketos_alerts', updated);
  return updated;
}

/**
 * @param {string} alertId
 * @param {number} snoozeDays
 */
export async function snoozeAlert(alertId, snoozeDays = 7) {
  const until = new Date();
  until.setDate(until.getDate() + snoozeDays);
  const stored = (await getData('pocketos_alerts')) || [];
  const updated = stored.map((a) => (
    a.id === alertId
      ? { ...a, status: 'snoozed', snoozedUntil: until.toISOString() }
      : a
  ));
  await setData('pocketos_alerts', updated);
  return updated;
}
