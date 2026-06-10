import { useRef, useEffect } from 'react';
import { View } from 'react-native';
import { useOnboardingScroll } from '../../lib/onboardingScroll';

/**
 * Wraps newly added onboarding content and scrolls it into view when `focusToken` matches `focusId`.
 *
 * @param {string} focusId - Unique id for this anchor
 * @param {string|null} focusToken - When equal to focusId, triggers scroll
 * @param {React.ReactNode} children
 */
export default function ScrollFocusAnchor({ focusId, focusToken, children }) {
  const anchorRef = useRef(null);
  const { scrollToAnchor } = useOnboardingScroll();

  useEffect(() => {
    if (focusToken && focusToken === focusId) {
      scrollToAnchor(anchorRef);
    }
  }, [focusToken, focusId, scrollToAnchor]);

  return (
    <View ref={anchorRef} collapsable={false}>
      {children}
    </View>
  );
}
