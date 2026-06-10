import { Platform } from 'react-native';
import { C } from '../constants/onboarding-theme';

/**
 * Shared web-friendly hover/press styles for tabs and text buttons.
 */
export function interactiveTextStyle({ pressed, hovered, selected, accent = false }) {
  return {
    opacity: pressed ? 0.7 : 1,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
    ...(Platform.OS === 'web' && hovered && !selected ? {
      color: accent ? C.accentPressed : C.primary,
    } : {}),
  };
}

export function tabItemStyle({ pressed, hovered, selected }) {
  return {
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: -1,
    borderBottomWidth: selected ? 2 : 0,
    borderBottomColor: C.accent,
    backgroundColor: pressed
      ? C.overlayPressed
      : hovered && !selected
        ? C.overlayHover
        : 'transparent',
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  };
}

export function textButtonStyle({ pressed, hovered }) {
  return {
    opacity: pressed ? 0.7 : 1,
    backgroundColor: hovered ? C.overlayHover : 'transparent',
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 2,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  };
}
