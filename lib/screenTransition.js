/** @typedef {'forward' | 'back' | 'lateral' | 'none'} ScreenTransitionDirection */

/** @type {ScreenTransitionDirection} */
let pendingDirection = 'none';

/**
 * Set animation direction for the next screen focus.
 * @param {ScreenTransitionDirection} direction
 */
export function setScreenTransitionDirection(direction) {
  pendingDirection = direction;
}

/**
 * Read and clear the pending transition (call once on screen focus).
 * @returns {ScreenTransitionDirection}
 */
export function consumeScreenTransitionDirection() {
  const direction = pendingDirection;
  pendingDirection = 'none';
  return direction;
}

/**
 * Dashboard metric card → tab.
 * @param {import('expo-router').Router} router
 * @param {string} route
 */
export function navigateFromDashboard(router, route) {
  setScreenTransitionDirection('forward');
  router.push(`/(app)/${route}`);
}

/**
 * Tab → dashboard (sidebar or programmatic).
 * @param {import('expo-router').Router} router
 */
export function navigateToDashboard(router) {
  setScreenTransitionDirection('back');
  router.push('/(app)/dashboard');
}

/**
 * Sidebar tab switch — no dashboard drill-down animation.
 * @param {import('expo-router').Router} router
 * @param {string} route
 * @param {string} [currentRoute]
 */
export function navigateAppTab(router, route, currentRoute) {
  if (route === 'dashboard' && currentRoute !== 'dashboard') {
    navigateToDashboard(router);
    return;
  }
  if (currentRoute === 'dashboard' && route !== 'dashboard') {
    navigateFromDashboard(router, route);
    return;
  }
  setScreenTransitionDirection('lateral');
  router.push(`/(app)/${route}`);
}
