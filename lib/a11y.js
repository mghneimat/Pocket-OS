import { Platform } from 'react-native';

/**
 * Visible keyboard focus ring for web TextInputs (replaces zeroed outline).
 * Border accent on focus is not enough for keyboard-only users on web.
 */
export function webFocusRing(focused) {
  if (Platform.OS !== 'web' || !focused) return {};
  return { boxShadow: '0 0 0 3px rgba(37, 99, 235, 0.35)' };
}
