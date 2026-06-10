import { useEffect } from 'react';
import { useSegments } from 'expo-router';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { consumeScreenTransitionDirection } from '../../lib/screenTransition';
import {
  DASHBOARD_MOTION_DURATION,
  DASHBOARD_MOTION_EASE,
  DASHBOARD_ENTER,
} from '../../lib/dashboardMotion';
import { useReducedMotion } from '../../lib/useReducedMotion';

/**
 * Route-focus enter animation for dashboard ↔ tab transitions.
 * @param {'dashboard' | 'tab'} variant
 */
export default function ScreenTransitionShell({ children, variant = 'tab' }) {
  const reduceMotion = useReducedMotion();
  const segments = useSegments();
  const currentRoute = segments[segments.length - 1];
  const inEditModal = segments.includes('edit');
  const isFocused = variant === 'dashboard'
    ? currentRoute === 'dashboard' && !inEditModal
    : !inEditModal && currentRoute !== 'dashboard';

  const opacity = useSharedValue(1);
  const translateY = useSharedValue(0);
  const translateX = useSharedValue(0);

  useEffect(() => {
    if (!isFocused) return;

    if (reduceMotion) {
      opacity.value = 1;
      translateY.value = 0;
      translateX.value = 0;
      consumeScreenTransitionDirection();
      return;
    }

    const direction = consumeScreenTransitionDirection();
    const enter = DASHBOARD_ENTER[direction] || DASHBOARD_ENTER.none;

    opacity.value = enter.opacity;
    translateY.value = enter.translateY;
    translateX.value = enter.translateX;

    opacity.value = withTiming(1, { duration: DASHBOARD_MOTION_DURATION, easing: DASHBOARD_MOTION_EASE });
    translateY.value = withTiming(0, { duration: DASHBOARD_MOTION_DURATION, easing: DASHBOARD_MOTION_EASE });
    translateX.value = withTiming(0, { duration: DASHBOARD_MOTION_DURATION, easing: DASHBOARD_MOTION_EASE });
  }, [isFocused, currentRoute, reduceMotion, variant, opacity, translateY, translateX]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: translateY.value },
      { translateX: translateX.value },
    ],
  }));

  return (
    <Animated.View style={[{ flex: 1 }, animatedStyle]}>
      {children}
    </Animated.View>
  );
}
