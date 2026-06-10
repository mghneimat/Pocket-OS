import { createContext, useContext } from 'react';

/**
 * @typedef {Object} OnboardingScrollContextValue
 * @property {import('react').RefObject<import('react-native').ScrollView>} scrollRef
 * @property {import('react').RefObject<import('react-native').View>} contentRef
 * @property {(anchorRef: import('react').RefObject<import('react-native').View>) => void} scrollToAnchor
 */

/** @type {import('react').Context<OnboardingScrollContextValue | null>} */
export const OnboardingScrollContext = createContext(null);

/**
 * Scroll helper for onboarding screens — measures anchor position inside QuestionScreen content.
 * @returns {OnboardingScrollContextValue}
 */
export function useOnboardingScroll() {
  const ctx = useContext(OnboardingScrollContext);
  if (!ctx) {
    return { scrollRef: { current: null }, contentRef: { current: null }, scrollToAnchor: () => {} };
  }
  return ctx;
}
