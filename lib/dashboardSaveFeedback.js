/** @typedef {{ after: number, delta: number, currencyCode: string }} SaveFeedbackPayload */

/** @type {Set<(payload: SaveFeedbackPayload) => void>} */
const listeners = new Set();

/** @type {SaveFeedbackPayload | null} */
let lastFeedback = null;

/**
 * Broadcast post-save spending-budget feedback to dashboard screens.
 * @param {SaveFeedbackPayload} payload
 */
export function emitSaveFeedback(payload) {
  lastFeedback = payload;
  listeners.forEach((fn) => fn(payload));
}

/** @returns {SaveFeedbackPayload | null} */
export function peekSaveFeedback() {
  return lastFeedback;
}

/** @param {(payload: SaveFeedbackPayload) => void} listener */
export function subscribeSaveFeedback(listener) {
  listeners.add(listener);
  if (lastFeedback) listener(lastFeedback);
  return () => listeners.delete(listener);
}

export function clearSaveFeedback() {
  lastFeedback = null;
}
