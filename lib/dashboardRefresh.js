/** @type {Set<() => void>} */
const listeners = new Set();

/** Subscribe to dashboard data refresh (e.g. after section edit save). Returns unsubscribe. */
export function subscribeDashboardRefresh(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Notify all dashboard views to reload their data. */
export function notifyDashboardRefresh() {
  listeners.forEach((fn) => fn());
}
