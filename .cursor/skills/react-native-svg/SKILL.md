---
name: react-native-svg
description: >-
  Renders SVG graphics in React Native / Expo — icons, illustrations, charts,
  and animated paths via Reanimated. Use when adding or editing SVG components,
  splash illustrations, inline icons, Path/Rect/Circle graphics, importing .svg
  files, or when the user mentions react-native-svg, Svg, or vector graphics.
---

# React Native SVG — Expo

Render **vector graphics** with `react-native-svg` in Expo projects. Use JSX primitives (`Svg`, `Path`, `Circle`, …) — not raw HTML `<svg>` or web-only SVG imports without a transformer.

**Official docs:** https://github.com/software-mansion/react-native-svg  
**Expo SDK:** https://docs.expo.dev/versions/latest/sdk/svg/

**Companion skills:** Use `react-native-reanimated-v4` for animated SVG props; use `cross-platform-rn-ui` for screen layout; use `tailwind` / `gluestack-ui-rn-v3` for surrounding UI — keep SVG as its own component layer.

## Before writing code

1. **Detect version** — read `package.json`:
   - pocket-os pins `react-native-svg@^13.9.0` (Gluestack UI v1 peer) — keep that unless upgrading Gluestack
   - Expo SDK 56 bundles `15.x` — use `npx expo install react-native-svg`; pin `15.15.5+` if TypeScript 6 strict errors appear
2. **Search existing SVG** — grep `react-native-svg` for icons (`SplashScreen`, `QuestionScreen`) and splash illustrations (`app/(onboarding)/splash-*.jsx`). Reuse patterns before inventing new ones.
3. **Prefer inline JSX** — pocket-os splash art and icons are hand-written JSX, not imported `.svg` files. Only add `react-native-svg-transformer` if the user explicitly needs `.svg` asset imports.
4. **After install** — Expo Go includes native code; bare workflow needs `npx expo prebuild` after version changes.

## Setup (Expo)

```bash
npx expo install react-native-svg
```

| Requirement | Detail |
|-------------|--------|
| Platforms | iOS, Android, Web, tvOS — all supported in Expo |
| Gluestack v1 | Peer `>=13.4.0`; pocket-os docs pin `13.9.0` |
| TypeScript 6 + SDK 56 | If `tsc` fails on svg types, pin `15.15.5` (see [reference.md](reference.md)) |

Move `react-native-svg` to **dependencies** (not devDependencies) if the app renders SVG at runtime.

## Import pattern (default)

```tsx
import Svg, { Path, Rect, Circle, G, Ellipse, Line } from 'react-native-svg';
```

| Element | Use for |
|---------|---------|
| `Svg` | Root container — always required |
| `Path` | Icons, curves, arbitrary shapes (`d` attribute) |
| `Rect` | Boxes, bars, rounded cards (`rx`/`ry`) |
| `Circle` / `Ellipse` | Dots, bubbles, decorative shapes |
| `Line` | Simple strokes |
| `G` | Group + `transform`, shared `opacity` |
| `Text as SvgText` | Labels inside SVG — **never** bare `Text` (conflicts with RN `Text`) |
| `Defs`, `LinearGradient`, `Stop`, `ClipPath` | Gradients and clipping |

Namespace import (`import * as Svg from 'react-native-svg'`) works but pocket-os uses named imports.

## Props rules

SVG attributes use **camelCase** in React Native:

| SVG / HTML | react-native-svg |
|------------|------------------|
| `stroke-width` | `strokeWidth` |
| `stroke-linecap` | `strokeLinecap` |
| `fill-rule` | `fillRule` |
| `text-anchor` | `textAnchor` |
| `font-size` | `fontSize` |
| `xmlns` | Not needed on `<Svg>` |

| Rule | Do | Don't |
|------|----|-------|
| Sizing | Fixed `width`/`height` + `viewBox` for scaling | Omit `viewBox` when art must scale cleanly |
| Colors | Hex `#1D3557`, theme tokens (`C.primary`), or `rgba(...)` | CSS variables or `currentColor` (limited support) |
| Opacity | `opacity={0.5}` number | String `"0.5"` works but prefer numbers |
| Stroke icons | `fill="none"` + `stroke` + `strokeWidth` | Mix RN icon fonts when Gluestack icons break — use SVG (see `ArrowLeftIcon`) |
| Responsive | `width="100%"` + `preserveAspectRatio="xMidYMid meet"` | Percentage height without parent flex bounds |
| Nesting | Single root `<Svg>` per graphic | `<svg>` inside `<Svg>` |

## Pocket-os patterns

### Small icon component

Reusable icon with `size` and `color` props — matches `SplashScreen.jsx` / `QuestionScreen.jsx`:

```tsx
function ArrowLeftIcon({ color = '#6B7A99', size = 16 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5m7-7l-7 7 7 7"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
```

### Splash illustration (inline child)

Pass as `children` to `SplashScreen` — fixed artboard, design-token colours:

```tsx
<SplashScreen {...props}>
  <Svg width="200" height="160" viewBox="0 0 200 160" fill="none">
    <Rect x="50" y="70" width="100" height="75" rx="4" fill="#1D3557" opacity={0.08} />
    <Path d="M40 75 L100 35 L160 75" stroke="#1D3557" strokeWidth={3} fill="none" />
  </Svg>
</SplashScreen>
```

### Full-width placeholder

`PlaceholderIllustration.jsx` — percentage width, explicit `viewBox`, `preserveAspectRatio`:

```tsx
<Svg width="100%" height="100%" viewBox="0 0 560 300" preserveAspectRatio="xMidYMid meet">
  <Rect width="560" height="300" fill="#F8FAFF" rx="10" />
</Svg>
```

Wrap in a `View` with explicit height (e.g. `h-[300px]`) when using `height="100%"`.

### Chart / dashboard graphic

Group segments with `<G transform="translate(x, y)">` — see `dashboard.jsx` pie paths.

### SVG text

```tsx
import Svg, { Text as SvgText } from 'react-native-svg';

<SvgText x="170" y="125" textAnchor="middle" fontSize="14" fill="#3A8C6E" fontWeight="bold">
  Kč
</SvgText>
```

User-facing strings inside SVG still need i18n — pass `t('...')` as child text.

## Animated SVG (with Reanimated)

Animate **SVG element props** (not style transforms on `Svg` root) via `useAnimatedProps`:

```tsx
import Animated, { useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

function PulseDot() {
  const r = useSharedValue(8);
  const animatedProps = useAnimatedProps(() => ({ r: r.value }));

  useEffect(() => {
    r.value = withTiming(12, { duration: 600 });
  }, []);

  return (
    <Svg width={40} height={40} viewBox="0 0 40 40">
      <AnimatedCircle cx={20} cy={20} fill="#2563EB" animatedProps={animatedProps} />
    </Svg>
  );
}
```

- Define `Animated.createAnimatedComponent(...)` **outside** the component (module scope).
- Read skill `react-native-reanimated-v4` for timing, springs, and worklet rules.
- Animatable props: `r`, `cx`, `cy`, `x`, `y`, `width`, `height`, `strokeDashoffset`, `opacity` (via animatedProps), etc.

## Converting designer SVG → JSX

1. Open `.svg` in editor; copy inner elements (not the outer `<svg>` wrapper).
2. Replace kebab-case attrs with camelCase.
3. Set `viewBox` from original `viewBox` or `width`/`height`.
4. Replace `class` / CSS with inline `fill` / `stroke` props.
5. Swap `<text>` → `<SvgText>`; remove `<style>` blocks and `url(#id)` refs unless you add matching `<Defs>`.
6. Simplify paths if file is huge — prefer single `Path` per icon.

## Decision checklist

```
Need graphics?
├─ Tab bar / button icon (< 32px)?     → Small Svg + Path icon component
├─ Onboarding splash art?              → Inline Svg child of SplashScreen (200×160 viewBox)
├─ Responsive banner?                  → width="100%" + viewBox + parent with fixed height
├─ Data viz (pie, bar)?                → Path / Rect + theme tokens in G groups
├─ Motion on shape props?              → createAnimatedComponent + useAnimatedProps
└─ External .svg asset file?           → react-native-svg-transformer (only if required)
```

## Anti-patterns

- Using HTML `<svg>`, `<path>` in React Native JSX
- Importing `Text` from `react-native-svg` without aliasing — clashes with RN `Text`
- Putting `Animated.View` transforms on `Svg` instead of animating inner shapes
- Hardcoding user-facing SVG labels without `useI18n()` / `t()`
- Upgrading to react-native-svg 15.x while on Gluestack v1 without checking peer compatibility
- Leaving SVG only in devDependencies when production screens render it

## Additional resources

- Element list, gradients, filters, TS version notes: [reference.md](reference.md)
- Pocket-os-style icons, splashes, charts, animation: [examples.md](examples.md)
