import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import {
  DASHBOARD_MOTION_DURATION,
  DASHBOARD_MOTION_EASE,
  DASHBOARD_ENTER,
} from '../../lib/dashboardMotion';
import { useReducedMotion } from '../../lib/useReducedMotion';

/**
 * Fade + slide when in-page tab panel key changes (e.g. expenses primary/secondary tabs).
 */
export default function DashboardTabPanel({ panelKey, children, style }) {
  const reduceMotion = useReducedMotion();
  const opacity = useSharedValue(1);
  const translateY = useSharedValue(0);
  const translateX = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) {
      opacity.value = 1;
      translateY.value = 0;
      translateX.value = 0;
      return;
    }

    const enter = DASHBOARD_ENTER.lateral;
    opacity.value = enter.opacity;
    translateY.value = enter.translateY;
    translateX.value = enter.translateX;

    opacity.value = withTiming(1, { duration: DASHBOARD_MOTION_DURATION, easing: DASHBOARD_MOTION_EASE });
    translateY.value = withTiming(0, { duration: DASHBOARD_MOTION_DURATION, easing: DASHBOARD_MOTION_EASE });
    translateX.value = withTiming(0, { duration: DASHBOARD_MOTION_DURATION, easing: DASHBOARD_MOTION_EASE });
  }, [panelKey, reduceMotion, opacity, translateY, translateX]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: translateY.value },
      { translateX: translateX.value },
    ],
  }));

  if (reduceMotion) {
    return <View style={style}>{children}</View>;
  }

  return (
    <Animated.View style={[style, animatedStyle]}>
      {children}
    </Animated.View>
  );
}
