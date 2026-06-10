import { useRef, useEffect } from 'react';
import { Animated, Easing } from 'react-native';
import { USE_NATIVE_DRIVER } from '../../lib/animation';

/**
 * Animated row that fades + slides in on mount and out when `visible` becomes false.
 * Uses native driver on iOS/Android; JS driver on web.
 *
 * @param {Object} props
 * @param {boolean} props.visible - Whether the row should be visible
 * @param {React.ReactNode} props.children - Row content
 * @param {Function} [props.onAnimationEnd] - Called when hide animation completes
 * @param {number} [props.duration=280] - Animation duration in ms
 */
export default function AnimatedRow({ visible, children, onAnimationEnd, duration = 280, style }) {
  const anim = useRef(new Animated.Value(visible ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: visible ? 1 : 0,
      duration,
      easing: Easing.bezier(0.16, 1, 0.3, 1),
      useNativeDriver: USE_NATIVE_DRIVER,
    }).start(() => {
      if (!visible && onAnimationEnd) {
        onAnimationEnd();
      }
    });
  }, [visible]);

  return (
    <Animated.View
      style={{
        opacity: anim,
        transform: [
          {
            translateX: anim.interpolate({
              inputRange: [0, 1],
              outputRange: [20, 0],
            }),
          },
        ],
        marginBottom: 10,
        ...style,
      }}
    >
      {children}
    </Animated.View>
  );
}
