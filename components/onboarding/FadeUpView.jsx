import { useRef, useEffect } from 'react';
import { Animated, Easing } from 'react-native';
import { USE_NATIVE_DRIVER } from '../../lib/animation';
import { useReducedMotion } from '../../lib/useReducedMotion';

/**
 * Animated wrapper that fades in + slides up its children.
 *
 * Mimics the CSS animation from pocketos-new-onboarding-design-v2.html:
 *   @keyframes fadeUp {
 *     from { opacity: 0; transform: translateY(18px); }
 *     to   { opacity: 1; transform: translateY(0); }
 *   }
 *   .screen { animation: fadeUp 0.35s ease both; }
 *
 * The animation re-triggers whenever the `animationKey` prop changes, making it
 * perfect for step transitions within a screen (e.g. when `currentStep`
 * changes in household.jsx) or for mount animations on splash screens.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Content to animate
 * @param {any} [props.animationKey] - When this changes, the animation replays
 * @param {number} [props.duration=400] - Animation duration in ms
 * @param {number} [props.translateY=12] - Starting vertical offset in px
 * @param {object} [props.style] - Additional styles for the animated container
 */
export default function FadeUpView({ children, animationKey, duration = 400, translateY = 12, style }) {
  const reduceMotion = useReducedMotion();
  const opacity = useRef(new Animated.Value(reduceMotion ? 1 : 0)).current;
  const translate = useRef(new Animated.Value(reduceMotion ? 0 : translateY)).current;

  const runAnimation = () => {
    if (reduceMotion) {
      opacity.setValue(1);
      translate.setValue(0);
      return;
    }

    opacity.setValue(0);
    translate.setValue(translateY);

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration,
        easing: Easing.bezier(0.16, 1, 0.3, 1),
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
      Animated.timing(translate, {
        toValue: 0,
        duration,
        easing: Easing.bezier(0.16, 1, 0.3, 1),
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
    ]).start();
  };

  useEffect(() => {
    runAnimation();
  }, [animationKey, reduceMotion]);

  return (
    <Animated.View
      style={[
        {
          opacity,
          transform: [{ translateY: translate }],
        },
        style,
      ]}
    >
      {children}
    </Animated.View>
  );
}
