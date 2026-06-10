import { useEffect, useRef, useState } from 'react';
import { View, Animated, Easing } from 'react-native';
import { DASHBOARD_MOTION_DURATION } from '../../lib/dashboardMotion';
import { useReducedMotion } from '../../lib/useReducedMotion';

const COLLAPSE_EASE = Easing.bezier(0.16, 1, 0.3, 1);

/**
 * Height-based expand/collapse — animates open and closed (budget-table pattern).
 */
export default function AnimatedCollapse({ visible, children, style, fallbackHeight = 72 }) {
  const reduceMotion = useReducedMotion();
  const progress = useRef(new Animated.Value(visible ? 1 : 0)).current;
  const [measuredHeight, setMeasuredHeight] = useState(0);
  const targetHeight = measuredHeight > 0 ? measuredHeight : fallbackHeight;

  useEffect(() => {
    if (reduceMotion) return;

    Animated.timing(progress, {
      toValue: visible ? 1 : 0,
      duration: DASHBOARD_MOTION_DURATION,
      easing: COLLAPSE_EASE,
      useNativeDriver: false,
    }).start();
  }, [visible, reduceMotion, progress]);

  const animatedHeight = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, targetHeight],
  });

  const animatedOpacity = progress.interpolate({
    inputRange: [0, 0.35, 1],
    outputRange: [0, 0.85, 1],
  });

  if (reduceMotion) {
    return visible ? <View style={style}>{children}</View> : null;
  }

  return (
    <Animated.View style={[{ overflow: 'hidden', height: animatedHeight, opacity: animatedOpacity }, style]}>
      <View
        onLayout={(event) => {
          const nextHeight = event.nativeEvent.layout.height;
          if (nextHeight > 0 && Math.abs(nextHeight - measuredHeight) > 1) {
            setMeasuredHeight(nextHeight);
          }
        }}
      >
        {children}
      </View>
    </Animated.View>
  );
}
