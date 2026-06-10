# Reanimated v4 — Examples

Expo-focused patterns matching common pocket-os UI (onboarding fades, drawer, progress bars, expand/collapse).

## Fade up on mount / key change

Replaces `FadeUpView.jsx` (`Animated.timing` + `translateY` + `opacity`).

### Option A — Layout animation (simplest)

```tsx
// components/onboarding/FadeUpView.jsx
import Animated, { FadeInUp } from 'react-native-reanimated';

export default function FadeUpView({
  children,
  animationKey,
  duration = 400,
  translateY = 12,
  style,
}) {
  return (
    <Animated.View
      key={animationKey}
      entering={FadeInUp.duration(duration).withInitialValues({
        opacity: 0,
        transform: [{ translateY }],
      })}
      style={style}
    >
      {children}
    </Animated.View>
  );
}
```

### Option B — Shared values (full control over easing)

```tsx
import { useEffect } from 'react';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

const EASE_OUT = Easing.bezier(0.16, 1, 0.3, 1);

export default function FadeUpView({
  children,
  animationKey,
  duration = 400,
  translateY = 12,
  style,
}) {
  const opacity = useSharedValue(0);
  const translate = useSharedValue(translateY);

  useEffect(() => {
    opacity.value = 0;
    translate.value = translateY;
    opacity.value = withTiming(1, { duration, easing: EASE_OUT });
    translate.value = withTiming(0, { duration, easing: EASE_OUT });
  }, [animationKey, duration, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translate.value }],
  }));

  return (
    <Animated.View style={[animatedStyle, style]}>
      {children}
    </Animated.View>
  );
}
```

## Slide-in drawer + backdrop fade

Replaces `HamburgerMenu.jsx` drawer pattern.

```tsx
import { useState } from 'react';
import { View, Pressable, Modal, Dimensions } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

const DRAWER_WIDTH = 280;

export function DrawerMenu({ visible, onClose, children }) {
  const slideX = useSharedValue(DRAWER_WIDTH);
  const backdropOpacity = useSharedValue(0);

  const open = () => {
    slideX.value = withTiming(0, { duration: 280 });
    backdropOpacity.value = withTiming(1, { duration: 280 });
  };

  const close = () => {
    slideX.value = withTiming(DRAWER_WIDTH, { duration: 240 });
    backdropOpacity.value = withTiming(0, { duration: 240 }, (finished) => {
      if (finished) scheduleOnRN(onClose);
    });
  };

  const drawerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: slideX.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  // Call open() when visible becomes true; close() from backdrop press
  return (
    <Modal transparent visible={visible} animationType="none">
      <Pressable style={{ flex: 1 }} onPress={close}>
        <Animated.View
          style={[
            { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
            backdropStyle,
          ]}
        />
      </Pressable>
      <Animated.View
        style={[
          { position: 'absolute', right: 0, top: 0, bottom: 0, width: DRAWER_WIDTH },
          drawerStyle,
        ]}
      >
        {children}
      </Animated.View>
    </Modal>
  );
}
```

## Progress bar fill

Replaces `QuestionScreen.jsx` / `SplashScreen.jsx` width animation.

```tsx
import { useEffect } from 'react';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

export function ProgressBar({ progress, duration = 300, style }) {
  const fill = useSharedValue(progress ?? 0);

  useEffect(() => {
    fill.value = withTiming(progress ?? 0, { duration });
  }, [progress, duration]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${fill.value * 100}%`,
  }));

  return (
    <View style={[{ height: 4, backgroundColor: '#E5E7EB', borderRadius: 2, overflow: 'hidden' }, style]}>
      <Animated.View
        style={[{ height: '100%', backgroundColor: '#6366F1', borderRadius: 2 }, fillStyle]}
      />
    </View>
  );
}
```

## Expand / collapse (height)

Replaces `budget.jsx` pattern animating `Animated.Value` as height.

```tsx
import { useEffect } from 'react';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

const COLLAPSED = 0;
const EXPANDED = 400; // set to measured content height or generous max

export function Collapsible({ open, children }) {
  const height = useSharedValue(COLLAPSED);

  useEffect(() => {
    height.value = withTiming(open ? EXPANDED : COLLAPSED, { duration: 220 });
  }, [open]);

  const containerStyle = useAnimatedStyle(() => ({
    height: height.value,
    overflow: 'hidden',
  }));

  return (
    <Animated.View style={containerStyle}>
      {children}
    </Animated.View>
  );
}
```

For dynamic content height, measure with `onLayout` and store target height in a shared value before animating.

## Staggered list entrance

Replaces `AnimatedSlideIn.jsx` / `AnimatedRow.jsx` delay pattern.

```tsx
import Animated, { FadeInDown } from 'react-native-reanimated';

export function StaggeredRow({ index, children }) {
  return (
    <Animated.View entering={FadeInDown.delay(index * 60).duration(350)}>
      {children}
    </Animated.View>
  );
}
```

## Conditional mount with exit

```tsx
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

{showPanel && (
  <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(160)}>
    <Panel />
  </Animated.View>
)}
```

Wrap parent in `Animated.View` or ensure parent allows layout animations (Reanimated 3+ handles this on the animated child directly).

## Press scale feedback

```tsx
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Pressable } from 'react-native';

export function ScalePressable({ onPress, children }) {
  const scale = useSharedValue(1);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      onPressIn={() => { scale.value = withSpring(0.96); }}
      onPressOut={() => { scale.value = withSpring(1); }}
      onPress={onPress}
    >
      <Animated.View style={style}>{children}</Animated.View>
    </Pressable>
  );
}
```

## RN Animated → Reanimated cheat sheet

| RN Animated | Reanimated 4 |
|-------------|--------------|
| `new Animated.Value(0)` | `useSharedValue(0)` |
| `anim.setValue(0)` | `anim.value = 0` |
| `Animated.timing(anim, { toValue: 1, duration: 300 }).start()` | `anim.value = withTiming(1, { duration: 300 })` |
| `Animated.parallel([a, b]).start()` | Assign both in same handler |
| `.start(({ finished }) => ...)` | Callback as 3rd arg to `withTiming`, or `scheduleOnRN` |
| `useNativeDriver: true` | Not needed (always UI thread) |
| `interpolate(anim, [...])` | `interpolate(anim.value, [...])` in worklet, or `useAnimatedStyle` |
