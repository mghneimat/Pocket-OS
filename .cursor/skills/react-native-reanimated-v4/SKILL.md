---
name: react-native-reanimated-v4
description: >-
  Implements React Native Reanimated 4.x animations in Expo (New Architecture)
  — shared values, useAnimatedStyle, layout animations, gestures, and migration
  from RN Animated. Use when adding or fixing animations, drawers, fades,
  progress bars, expand/collapse, withTiming/withSpring, worklets, or when the
  user mentions Reanimated, react-native-worklets, or UI-thread animations.
---

# React Native Reanimated v4 — Expo

Build **UI-thread animations** with Reanimated 4.x in Expo projects. Target **New Architecture only** (Fabric). Reanimated 3.x patterns mostly carry over; v4 adds `react-native-worklets` and renames a few runtime helpers.

**Official docs:** https://docs.swmansion.com/react-native-reanimated/docs/

**Companion skills:** Use `expo-sdk-56-router` for screen/routing structure; use `nativewind-v4` / `gluestack-ui-rn-v3` for styling — animate with Reanimated, style with existing project tokens.

## Before writing code

1. **Detect stack** — read `package.json`:
   - `react-native-reanimated` ≥ 4.x → follow this skill
   - `react-native-worklets` must be installed alongside Reanimated 4
   - Expo SDK 50+ includes the Worklets Babel plugin via `babel-preset-expo` (no manual plugin needed unless using bare RN CLI)
2. **Check existing animation code** — search for `react-native-reanimated` imports vs `Animated` from `react-native`. Prefer Reanimated for new work; migrate RN Animated when touching a file for animation reasons.
3. **Confirm New Architecture** — Reanimated 4 does not support Legacy Architecture. Expo SDK 52+ defaults to New Architecture.
4. **After native dependency changes** — run `npx expo prebuild` and clear Metro cache: `npx expo start --clear`.

## Setup (Expo)

```bash
npx expo install react-native-reanimated react-native-worklets
```

| Requirement | Detail |
|-------------|--------|
| New Architecture | Required for Reanimated 4 |
| `react-native-worklets` | Separate peer; version must match Reanimated compatibility table |
| Babel plugin | `'react-native-worklets/plugin'` — **listed last** in `plugins`. Expo preset includes it; bare CLI must add manually |
| Rebuild | `npx expo prebuild` after install or version bump |

Do **not** use `'react-native-reanimated/plugin'` — renamed to `'react-native-worklets/plugin'` in v4.

## Core API (default patterns)

### Animated components

```tsx
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';

const progress = useSharedValue(0);

const fillStyle = useAnimatedStyle(() => ({
  width: `${progress.value * 100}%`,
}));

// Inline shared values in style also work for simple cases:
<Animated.View style={{ width: progress }} />
```

### Rules

| Rule | Do | Don't |
|------|----|-------|
| Shared values | Read/write via `.value` on JS thread; inside worklets use `.value` directly | Assign `sv = 100` without `.value` |
| Styles | `useAnimatedStyle` for derived styles; keep worklet bodies pure | Read React state/props inside worklets without `useSharedValue` bridging |
| Drivers | Reanimated runs on UI thread by default — no `useNativeDriver` flag | Mix RN `Animated` and Reanimated on the same node |
| Timing | `withTiming(to, { duration, easing })` | Raw `.value = x` when you need smooth transition |
| Callbacks | `withTiming(to, {}, (finished) => { ... })` or layout `.withCallback()` | `runOnJS` — deprecated; use `scheduleOnRN` from `react-native-worklets` |
| Collapse height | Animate `maxHeight` or use `LayoutAnimationConfig` / entering-exiting | Animate `height: 'auto'` directly |

### Animation functions

- **`withTiming`** — duration + easing (replaces most `Animated.timing`)
- **`withSpring`** — spring physics; v4 changed defaults (`energyThreshold` replaces `restDisplacementThreshold` / `restSpeedThreshold`; `duration` is perceptual — divide old durations by 1.5 if matching v3 feel)
- **`withDelay`**, **`withRepeat`**, **`withSequence`**, **`withClamp`** — compose as in v3

### Easing

```tsx
import { Easing, withTiming } from 'react-native-reanimated';

opacity.value = withTiming(1, {
  duration: 400,
  easing: Easing.bezier(0.16, 1, 0.3, 1), // pocket-os fadeUp curve
});
```

## Common Expo UI patterns

Choose the simplest approach that fits:

| Pattern | Preferred approach |
|---------|-------------------|
| Mount fade / slide-in | Layout animation: `entering={FadeInUp.duration(400)}` |
| Re-trigger on key change | Remount with `key={animationKey}` or drive shared value in `useEffect` |
| Drawer + backdrop | Two shared values + `useAnimatedStyle`; `scheduleOnRN` for close callback |
| Progress bar width | Single shared value 0→1; `width: \`${progress.value * 100}%\`` in animated style |
| Expand/collapse section | Animate `maxHeight` shared value, or `entering`/`exiting` on conditional child |
| Press feedback | `useAnimatedStyle` + `withSpring` on scale, or Gesture Handler `Gesture.Tap()` |

Detailed before/after examples: [examples.md](examples.md).

## Layout animations (quick)

For enter/exit without manual shared values:

```tsx
import Animated, { FadeInUp, FadeOut } from 'react-native-reanimated';

<Animated.View entering={FadeInUp.duration(400)} exiting={FadeOut.duration(200)}>
  {children}
</Animated.View>
```

Chain modifiers: `.duration()`, `.delay()`, `.easing()`, `.springify()`, `.withCallback((finished) => ...)`.

Replace removed `combineTransition` with:

```tsx
EntryExitTransition.entering(entering).exiting(exiting);
```

## Worklets & thread bridging (v4)

Import from `react-native-worklets` (re-exports from Reanimated are deprecated):

| v3 / old | v4 |
|----------|-----|
| `runOnJS(fn)(args)` | `scheduleOnRN(fn, ...args)` |
| `runOnUI(fn)(args)` | `scheduleOnUI(fn, ...args)` |
| `executeOnUIRuntimeSync(fn)(args)` | `runOnUISync(fn, ...args)` |
| `useWorkletCallback` | `useCallback` + `'worklet';` directive |

```tsx
import { scheduleOnRN } from 'react-native-worklets';

withTiming(0, { duration: 240 }, (finished) => {
  if (finished) scheduleOnRN(onCloseComplete);
});
```

## Migration from RN Animated

When converting existing `Animated` from `react-native`:

1. Replace `Animated.Value` → `useSharedValue(initial)`
2. Replace `Animated.timing(x, { toValue }).start()` → `x.value = withTiming(toValue, { duration })`
3. Replace `Animated.parallel([...])` → assign multiple shared values in same handler, or `withSequence` / separate assignments
4. Replace `Animated.View` style refs → `useAnimatedStyle` returning `{ opacity, transform: [{ translateY }] }`
5. Replace `setValue` before animation → assign `.value` directly before `withTiming`
6. Replace completion callbacks → third arg to `withTiming` / `withSpring`, or `scheduleOnRN`

Do not partially migrate one animation in a file — convert the whole animated surface in that component.

## Decision checklist

```
New animation needed?
├─ Simple mount/unmount?     → Layout entering/exiting
├─ Driven by prop/state?     → useSharedValue + useEffect to assign withTiming
├─ Gesture-driven?           → react-native-gesture-handler Gesture API (not useAnimatedGestureHandler)
├─ Scroll-linked?            → useScrollOffset (not useScrollViewOffset)
└─ Height expand/collapse?   → maxHeight shared value OR layout animations
```

## Anti-patterns

- Using Reanimated 4 on Legacy Architecture
- Importing `Animated` from `react-native` in new animation code
- Reading React state inside `useAnimatedStyle` without syncing to a shared value
- Forgetting `'worklet';` in callbacks passed to `scheduleOnUI` / custom worklets
- Adding `'react-native-worklets/plugin'` before other Babel plugins (must be **last**)
- Using `useNativeDriver` — not applicable to Reanimated

## Additional resources

- v4 breaking changes & renames: [reference.md](reference.md)
- Pocket-os-style examples (fadeUp, drawer, progress, expand): [examples.md](examples.md)
