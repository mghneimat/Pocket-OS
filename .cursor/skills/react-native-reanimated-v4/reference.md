# Reanimated v4 — Reference

Condensed API and migration notes. Full docs: https://docs.swmansion.com/react-native-reanimated/docs/

## Version & compatibility

| Package | Role |
|---------|------|
| `react-native-reanimated` 4.x | Animation API, layout animations, animated components |
| `react-native-worklets` | Worklet runtime, Babel plugin, thread scheduling |
| New Architecture (Fabric) | **Required** — v4 drops Paper/Legacy Architecture |

Check the [compatibility table](https://docs.swmansion.com/react-native-reanimated/docs/guides/compatibility/) for matching `react-native-worklets` version.

## Babel configuration

**Expo (SDK 50+):** `babel-preset-expo` includes `react-native-worklets/plugin`. Verify only if animations fail silently.

**Bare React Native CLI:**

```js
module.exports = {
  presets: ['babel-preset-expo'], // or your preset
  plugins: [
    // ...other plugins
    'react-native-worklets/plugin', // MUST be last
  ],
};
```

**Web (react-native-web):** also add `@babel/plugin-proposal-export-namespace-from` before the worklets plugin.

Renamed from `'react-native-reanimated/plugin'`.

## Hooks & functions (stable v4 API)

### Shared state

| API | Purpose |
|-----|---------|
| `useSharedValue(initial)` | Mutable animation state synced UI ↔ JS |
| `useDerivedValue(fn)` | Computed shared value from other shared values |
| `useAnimatedStyle(fn)` | Animated style object (worklet) |
| `useAnimatedProps(fn)` | Animated non-style props (SVG, etc.) |
| `useAnimatedReaction(prepare, react)` | React to shared value changes |
| `useScrollOffset(ref)` | Scroll-linked animations (renamed from `useScrollViewOffset`) |

### Animation builders

| API | Purpose |
|-----|---------|
| `withTiming(to, config?, callback?)` | Duration-based |
| `withSpring(to, config?, callback?)` | Spring-based |
| `withDecay(config?)` | Momentum / fling |
| `withDelay(ms, animation)` | Delay wrapper |
| `withRepeat(animation, count?, reverse?)` | Repeat |
| `withSequence(...animations)` | Chain |
| `withClamp(min, max, animation)` | Bound output |

### Components

| API | Purpose |
|-----|---------|
| `Animated.View`, `.Text`, `.ScrollView`, `.FlatList`, `.Image` | Built-in animated primitives |
| `Animated.createAnimatedComponent(Component)` | Wrap custom components (SVG, etc.) |
| `cancelAnimation(sharedValue)` | Stop running animation |

### Layout animations

| API | Purpose |
|-----|---------|
| `entering={FadeInUp}` / `exiting={FadeOut}` | Mount/unmount transitions |
| `layout={LinearTransition}` | Re-layout transitions |
| `EntryExitTransition.entering().exiting()` | Combined enter/exit |
| Modifiers: `.duration()`, `.delay()`, `.easing()`, `.springify()`, `.damping()`, `.withCallback()` | Customize |

Built-in presets include: `FadeIn`, `FadeInUp`, `FadeInDown`, `SlideInRight`, `SlideOutRight`, `ZoomIn`, `BounceIn`, etc.

## v4 breaking changes (from 3.x)

### Removed

- `useWorkletCallback` → `useCallback` + `'worklet';`
- `useAnimatedGestureHandler` → Gesture Handler 2 `Gesture.*` API
- `combineTransition` → `EntryExitTransition.entering().exiting()`
- `addWhitelistedNativeProps` / `addWhitelistedUIProps` → no-ops; remove usages
- `react-native-v8` support

### Renamed / moved to `react-native-worklets`

| Old (Reanimated) | New (worklets) |
|------------------|----------------|
| `runOnJS(fn)(...args)` | `scheduleOnRN(fn, ...args)` |
| `runOnUI(fn)(...args)` | `scheduleOnUI(fn, ...args)` |
| `executeOnUIRuntimeSync(fn)(...args)` | `runOnUISync(fn, ...args)` |
| `runOnRuntime(rt, fn)(...args)` | `scheduleOnRuntime(rt, fn, ...args)` |
| `makeShareableCloneRecursive` | `createSerializable` |
| `createWorkletRuntime`, `WorkletRuntime`, `isWorkletFunction` | Same names, import from `react-native-worklets` |

Deprecated re-exports from `react-native-reanimated` still work but should be updated.

### `withSpring` changes

- `restDisplacementThreshold` / `restSpeedThreshold` → `energyThreshold` (usually no override needed)
- `duration` is perceptual duration; actual time ≈ `duration * 1.5`
- Default spring params changed; restore v3 feel via:

```js
import {
  Reanimated3DefaultSpringConfig,
  Reanimated3DefaultSpringConfigWithDuration,
} from 'react-native-reanimated';
```

### Scroll

- `useScrollViewOffset` → `useScrollOffset` (old name deprecated)

## Gesture integration

Reanimated 4 integrates with **react-native-gesture-handler** 2.x the same as v3.

Do **not** use `useAnimatedGestureHandler`. Use:

```tsx
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

const pan = Gesture.Pan()
  .onUpdate((e) => {
    translateX.value = e.translationX;
  })
  .onEnd(() => {
    translateX.value = withSpring(0);
  });

<GestureDetector gesture={pan}>
  <Animated.View style={animatedStyle} />
</GestureDetector>
```

Requires `GestureHandlerRootView` at app root (Expo Router templates usually include this).

## Custom worklets

```tsx
function clamp(value: number, min: number, max: number) {
  'worklet';
  return Math.min(Math.max(value, min), max);
}
```

Or inline in `useAnimatedStyle`:

```tsx
const style = useAnimatedStyle(() => {
  'worklet';
  return { opacity: clamp(opacity.value, 0, 1) };
});
```

## Debugging tips

| Symptom | Likely cause |
|---------|--------------|
| Animation never runs | Missing worklets plugin; plugin not last; stale Metro cache |
| `[Reanimated] Reading from value during render` | Accessing `.value` during render on JS thread incorrectly |
| Worklet throws "not a worklet" | Missing `'worklet';` or Babel plugin |
| App crashes on Android/iOS after upgrade | Native rebuild needed (`expo prebuild`) |
| Legacy Architecture error | Upgrade to New Architecture or stay on Reanimated 3.x |

Clear cache: `npx expo start --clear`

## CSS animations (v4)

Reanimated 4 supports CSS-like animation props on `Animated` components alongside the shared-value API. Prefer shared values + `useAnimatedStyle` for dynamic/interactive animations; CSS-style props suit static declarative transitions. See official CSS animations docs when needed.
