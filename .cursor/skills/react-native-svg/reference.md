# React Native SVG — Reference

Condensed API and troubleshooting. Full docs: https://github.com/software-mansion/react-native-svg

## Version & compatibility

| Context | Version | Notes |
|---------|---------|-------|
| pocket-os (current) | `13.9.0` | Gluestack UI v1 peer; in devDependencies — move to dependencies for runtime SVG |
| Expo SDK 56 default | `15.15.x` | `npx expo install react-native-svg` |
| TypeScript 6 + 15.15.4 | Broken types | Pin `15.15.5` or exclude from expo install and set manually |
| RN 0.85 (pocket-os) | svg ≥12.3 | 15.x supported per compatibility table |

### TypeScript 6 workaround (SDK 56)

```json
{
  "expo": {
    "install": {
      "exclude": ["react-native-svg"]
    }
  },
  "dependencies": {
    "react-native-svg": "15.15.5"
  }
}
```

### Gluestack v1 pin (pocket-os)

```bash
npm install react-native-svg@13.9.0
```

Do not bump to 15.x until Gluestack peer range and icon behaviour are verified.

## Supported elements (common subset)

| Component | Key props |
|-----------|-----------|
| `Svg` | `width`, `height`, `viewBox`, `preserveAspectRatio`, `fill`, `stroke` |
| `G` | `opacity`, `transform`, `fill`, `stroke` |
| `Path` | `d`, `fill`, `stroke`, `strokeWidth`, `fillRule`, `strokeLinecap` |
| `Rect` | `x`, `y`, `width`, `height`, `rx`, `ry` |
| `Circle` | `cx`, `cy`, `r` |
| `Ellipse` | `cx`, `cy`, `rx`, `ry` |
| `Line` | `x1`, `y1`, `x2`, `y2` |
| `Polygon` | `points` (e.g. `"0,0 10,10 0,20"`) |
| `Polyline` | `points`, `fill="none"` typical |
| `Text` | `x`, `y`, `fontSize`, `fill`, `textAnchor`, `fontWeight` — alias as `SvgText` |
| `TSpan` | Nested text runs inside `Text` |
| `Defs` | Container for gradients, clips, markers |
| `LinearGradient` | `id`, `x1`, `y1`, `x2`, `y2` (0–1 or %) |
| `RadialGradient` | `id`, `cx`, `cy`, `rx`, `ry` |
| `Stop` | `offset`, `stopColor`, `stopOpacity` |
| `ClipPath` | `id` + child shape; reference via `clipPath="url(#id)"` |
| `Mask` | Opacity masking |
| `Use` | `href="#elementId"` (limited — prefer inline) |
| `Image` | `href` uri, `x`, `y`, `width`, `height` |
| `Symbol` | Reusable defs with `viewBox` |

## Transform strings

`transform` accepts SVG transform list syntax:

```
translate(120, 120)
rotate(-90 60 60)
scale(1.2)
matrix(a b c d e f)
```

Multiple transforms space-separated: `transform="translate(10,10) scale(0.5)"`.

## preserveAspectRatio

Format: `{align} {meetOrSlice}`

| Value | Behaviour |
|-------|-----------|
| `xMidYMid meet` | Scale uniformly, fit inside viewport (default-ish) |
| `xMidYMid slice` | Scale uniformly, fill viewport (may crop) |
| `none` | Stretch to fill |

Use with `viewBox` when `width`/`height` differ from artboard aspect ratio.

## Colour & opacity

- Hex: `#RRGGBB`, `#RRGGBBAA`
- Named: `transparent`, `none` (no fill)
- `rgba(r,g,b,a)` — supported
- `fill="url(#gradientId)"` — requires `<Defs>` with matching `id`
- Element `opacity` vs separate `fillOpacity` / `strokeOpacity`

## Touch & accessibility

- `onPress` on `Svg` or child shapes (v13+) for hit targets
- Wrap small icons in `Pressable` with `accessibilityLabel` from i18n
- Prefer min 44×44 pt touch target via padding on parent, not oversized stroke

## Web (Expo)

`react-native-svg` maps to SVG on web via `react-native-web`. Same JSX API. Test splashes on web when using percentage dimensions.

## Reanimated integration

| Step | Detail |
|------|--------|
| Wrap shape | `const AnimatedPath = Animated.createAnimatedComponent(Path)` at module scope |
| Animate props | `useAnimatedProps(() => ({ strokeDashoffset: offset.value }))` |
| Attach | `animatedProps={animatedProps}` on animated component |
| Avoid | `useAnimatedStyle` on `Svg` wrapper for path-specific attrs |

Animatable SVG attributes (common): `x`, `y`, `cx`, `cy`, `r`, `rx`, `ry`, `width`, `height`, `opacity`, `strokeDashoffset`, `strokeWidth`, `fill`, `stroke` (colour strings need care in worklets).

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Nothing renders | Missing `<Svg>` root; zero width/height; parent `overflow: hidden` with no size |
| Icon clipped | Add `viewBox`; increase stroke bounds or reduce `strokeWidth` |
| Blurry on scale | Use `viewBox` + integer `width`/`height`; avoid upscaling tiny rasterized exports |
| `Text` import error | Use `import { Text as SvgText }` from `react-native-svg` |
| Gradient not showing | `id` must be unique; reference `fill="url(#id)"`; wrap in `<Defs>` |
| Animation janky | Animate leaf shapes, not whole `Svg`; use Reanimated not RN `Animated` |
| Gluestack icon broken | Replace with inline `Path` icon (project pattern) |
| Metro can't import `.svg` | Add `react-native-svg-transformer` + metro resolver config |

## Converting Figma / Illustrator export

1. Export SVG, prettify XML.
2. Remove XML declaration and comments if Metro chokes (rare with inline paste).
3. Flatten transforms into paths when possible (simpler RN rendering).
4. Replace `stroke="currentColor"` with explicit hex from design tokens.
5. Merge overlapping paths for icons; keep layers for illustrations.
6. Test on device — some filters (`feGaussianBlur`) have limited native support; rasterize heavy effects if needed.

## Performance notes

- Prefer one `Path` per icon over many `<Rect>` fragments
- Large illustrations (50+ nodes) are fine for static splash screens
- Avoid re-creating `d` strings on every render — memoize or use static constants
- For long lists of identical icons, one shared component with props beats duplicating SVG trees
