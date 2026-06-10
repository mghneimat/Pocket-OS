---
name: nativewind-v4
description: >-
  Styles React Native / Expo UI with NativeWind v4 — Tailwind className on
  View, Text, Pressable, etc., configured via babel + metro + tailwind preset.
  MUST apply when adding or editing className styles, tailwind.config.js,
  global.css, babel/metro NativeWind setup, design tokens, dark: variants,
  platform prefixes, or cssInterop for third-party components — even if the
  user does not mention NativeWind, Tailwind, or className.
---

# NativeWind v4 — Expo (Babel + Metro)

Style React Native with **Tailwind utility classes** via the `className` prop. NativeWind v4 compiles classes at build time through **Babel** (`nativewind/babel`) and **Metro** (`withNativeWind`).

**Official docs:** https://www.nativewind.dev/docs/getting-started/installation

**Companion skills:** `expo-sdk-56-router` (layouts, `global.css` import site) · `react-native-reanimated-v4` (animate with Reanimated, style with `className`) · `gluestack-ui-rn-v3` (onboarding still uses Gluestack — do not mix blindly)

## Before writing code

1. **Detect stack** — read `package.json`: `nativewind` ≥ 4.x → this skill. Peers: `tailwindcss` ^3.4, `react-native-reanimated`, `react-native-safe-area-context`.
2. **Verify wiring** — all six pieces must exist and match (see Setup). If styles don't apply, fix config before adding classes.
3. **Match project area** — PocketOS **app screens** (`app/(app)/*`) use `className` + Tailwind tokens. **Onboarding** (`components/onboarding/*`) uses Gluestack + `constants/onboarding-theme` — don't convert onboarding to NativeWind unless asked.
4. **Reuse tokens** — grep `tailwind.config.js` `theme.extend` before inventing hex values. Prefer `bg-bg`, `text-text`, `text-muted`, `border-border`, `text-section`, `text-body`, etc.
5. **After config changes** — `npx expo start --clear`.

## Setup (required files)

| File | Role |
|------|------|
| `babel.config.js` | `jsxImportSource: "nativewind"` on `babel-preset-expo` + `"nativewind/babel"` preset |
| `metro.config.js` | `withNativeWind(config, { input: './global.css' })` |
| `global.css` | `@tailwind base/components/utilities` (+ optional CSS variables) |
| `tailwind.config.js` | `presets: [require("nativewind/preset")]`, correct `content` globs |
| `app/_layout.jsx` | `import '../global.css'` as **first import** |
| `app.json` | `expo.web.bundler: "metro"` for web |
| `nativewind-env.d.ts` | `/// <reference types="nativewind/types" />` + include in `tsconfig.json` |

### babel.config.js

```js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
  };
};
```

### metro.config.js

```js
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);
module.exports = withNativeWind(config, { input: './global.css' });
```

### tailwind.config.js content globs

Include **every** directory with `className` strings. Missing paths = classes silently dropped.

```js
content: [
  "./app/**/*.{js,jsx,ts,tsx}",
  "./components/**/*.{js,jsx,ts,tsx}",
],
presets: [require("nativewind/preset")],
```

## Core styling rules

### Use `className` on React Native primitives

Works out of the box: `View`, `Text`, `ScrollView`, `Pressable`, `Image`, `TextInput`, `SafeAreaView`.

```tsx
<View className="flex-1 bg-bg px-5">
  <Text className="text-section text-text font-semibold">Title</Text>
  <Pressable className="px-6 py-3 border border-border rounded-lg active:bg-chip-active">
    <Text className="text-body text-primary font-medium">Action</Text>
  </Pressable>
</View>
```

### PocketOS design tokens (tailwind.config.js)

| Token | Example classes |
|-------|-------------------|
| Surfaces | `bg-bg`, `bg-surface` |
| Text | `text-text`, `text-muted`, `text-primary`, `text-accent` |
| Semantic | `text-positive`, `text-warning`, `text-danger`, `text-debt` |
| Borders | `border-border`, `border-divider` |
| Typography | `text-display`, `text-section`, `text-body`, `text-caption`, `text-money-large`, `text-eyebrow` |
| Radius | `rounded-xl`, `rounded-lg`, `rounded-md` |
| Interactive | `active:bg-chip-active` |

Dark-mode token variants exist in config (`primary.dark`, etc.) — use `dark:` prefix when dark mode is enabled on a parent. Details: [reference.md](reference.md).

### `className` + `style`

Combine when needed (animated values, one-off dimensions):

```tsx
<Animated.View className="flex-1 bg-bg" style={animatedStyle} />
```

Prefer `className` for static layout/color/type; reserve `style` for dynamic or unsupported utilities.

### React import gotcha

`jsxImportSource: "nativewind"` does **not** auto-import `React`. Never use `React.useState` without `import React from 'react'` — destructure hooks instead:

```tsx
import { useState } from 'react'; // ✅
// React.useState(false)           // ❌ runtime error
```

## Third-party components

Gluestack `Text`, `Button`, etc. do **not** accept `className` unless configured. Options:

1. Use RN primitives (`Text` from `react-native`) where PocketOS app screens already do.
2. Register with `cssInterop` — see [reference.md](reference.md).
3. In onboarding, keep Gluestack + `C`/`T`/`S` tokens from `constants/onboarding-theme`.

## Variants & modifiers

| Pattern | Example |
|---------|---------|
| State | `active:bg-chip-active`, `disabled:opacity-50` |
| Dark | `dark:bg-bg-dark dark:text-text-dark` |
| Platform | `ios:pt-4 android:pt-2`, `web:cursor-pointer` |
| Responsive | `md:flex-row` (web-focused; limited on native) |

Not all web Tailwind utilities work on native — see [reference.md](reference.md) unsupported list.

## Decision checklist

```
Styling a screen?
├─ app/(app) or new shared component?  → className + tailwind tokens
├─ onboarding component?             → Gluestack + onboarding-theme (unless migrating)
├─ Third-party component?            → cssInterop OR wrap in styled View
├─ Animated layout?                  → className for static; Reanimated style for motion
└─ New color/size token?             → add to tailwind.config.js theme.extend (+ global.css vars if web)
```

## Anti-patterns

- Hardcoded hex in `className` when a token exists (`text-[#1E3A5F]` vs `text-text`)
- `className` on Gluestack components without `cssInterop`
- Forgetting to add new file paths to `tailwind.config.js` `content`
- Missing `global.css` import or wrong Metro `input` path
- Using `React.*` without importing React
- Expecting every CSS utility (grid, `backdrop-blur`, arbitrary properties) to work on native
- Changing babel/metro without clearing Metro cache

## Additional resources

- Full config, dark mode, cssInterop, troubleshooting: [reference.md](reference.md)
- PocketOS-style screen and token examples: [examples.md](examples.md)
