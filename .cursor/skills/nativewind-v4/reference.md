# NativeWind v4 — Reference

Condensed config and API notes. Full docs: https://www.nativewind.dev/docs/

## Version & peers

| Package | Role |
|---------|------|
| `nativewind` ^4.x | `className` compiler, Metro/Babel integration |
| `tailwindcss` ^3.4 | Config, preset, utility generation |
| `react-native-reanimated` | Peer dependency |
| `react-native-safe-area-context` | Peer dependency |

**v4 Metro API:** `withNativeWind` (capital W). v5 renames to `withNativewind` — do not mix.

## File-by-file setup

### global.css

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

Optional CSS variables for web (`:root`, `.dark`) — PocketOS mirrors tokens in `tailwind.config.js` and `global.css`.

### TypeScript

`nativewind-env.d.ts` at project root:

```ts
/// <reference types="nativewind/types" />
```

Include in `tsconfig.json`:

```json
"include": ["**/*.ts", "**/*.tsx", "nativewind-env.d.ts"]
```

**Do not name the file** `nativewind.d.ts`, `app.d.ts`, or any name conflicting with a folder or `node_modules` package.

### app.json (web)

```json
{
  "expo": {
    "web": {
      "bundler": "metro"
    }
  }
}
```

## Extending theme tokens

Add to `tailwind.config.js` → `theme.extend`. Use nested keys for variants:

```js
colors: {
  primary: {
    DEFAULT: '#1E3A5F',
    dark: '#818CF8',  // use as dark:text-primary-dark
  },
},
fontSize: {
  section: ['24px', { lineHeight: '1.2', fontWeight: '400' }],
},
```

After adding tokens, use them immediately in `className` — no JS import needed.

## Dark mode

NativeWind supports `dark:` variant when dark mode is active. Strategies:

| Strategy | Setup |
|----------|-------|
| Class on root | Toggle `dark` class on a wrapper `View` / web `html` |
| `useColorScheme` | Sync scheme to a parent with `className={colorScheme === 'dark' ? 'dark' : ''}` |
| CSS variables | `global.css` `.dark { --color-bg: ... }` for web |

PocketOS tokens use `color.dark` suffix in Tailwind config (e.g. `bg-bg-dark` maps to `bg.dark`).

## Platform variants

```tsx
<View className="ios:shadow-sm android:elevation-2 web:shadow-md">
  <Text className="ios:text-base android:text-lg">Platform text</Text>
</View>
```

Prefixes: `ios:`, `android:`, `web:`, `native:` (ios + android).

## cssInterop (third-party components)

Register components that don't forward `className`:

```tsx
import { Text } from 'react-native';
import { cssInterop } from 'nativewind';

// Map className → style on the component
cssInterop(Text, { className: 'style' });

// Map className → specific prop
cssInterop(SomeIcon, {
  className: {
    target: 'style',
    nativeStyleToProp: { color: 'fill', height: 'height', width: 'width' },
  },
});
```

Call `cssInterop` once at module level (e.g. `app/_layout.jsx` or a `lib/nativewind.ts` setup file).

**remapProps** — alternative for mapping className to custom prop names:

```tsx
import { remapProps } from 'nativewind';
remapProps(FlatList, { className: 'style', contentContainerClassName: 'contentContainerStyle' });
```

## Supported vs limited utilities

### Reliable on native

- Flexbox: `flex`, `flex-row`, `items-*`, `justify-*`, `flex-1`, `gap-*`
- Spacing: `p-*`, `px-*`, `py-*`, `m-*`, `mt-*`, etc.
- Sizing: `w-*`, `h-*`, `min-h-*`, `max-w-*`
- Colors: `bg-*`, `text-*`, `border-*` (from theme)
- Typography: `text-*` (size tokens), `font-*`, `text-center`
- Borders: `border`, `border-*`, `rounded-*`
- Opacity: `opacity-*`

### Limited or web-only

- `grid`, `grid-cols-*` — limited native support
- `backdrop-*`, `filter`, `blur` — web-first
- `hover:` — web only (use `active:` on native)
- `position: fixed`, `sticky` — platform differences
- Arbitrary values `w-[347px]` — use sparingly; prefer theme tokens

When a utility fails silently, fall back to `style` or add a theme token.

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| No styles at all | Verify babel + metro + `global.css` import; run `npx expo start --clear` |
| Some classes missing | Add file path to `tailwind.config.js` `content` array |
| `className` TS error | Add `nativewind-env.d.ts` + tsconfig include |
| `React is not defined` | Import hooks from `'react'`; don't use `React.useState` |
| Works on iOS, not web | Confirm `app.json` → `web.bundler: "metro"` |
| Custom Metro wrapper | `withNativeWind` must wrap the **final** exported config |
| Gluestack ignores className | Expected — use RN primitives or `cssInterop` |

### Cache clear

```bash
npx expo start --clear
```

### Verify Tailwind sees classes

Temporarily add a loud utility (`bg-red-500`) on a `View`. If it works, config is fine — the original class may be mistyped or not in `content` paths.

## Migration from NativeWind v2

| v2 | v4 |
|----|-----|
| Babel plugin only | Babel preset + Metro `withNativeWind` |
| `styled()` components | Prefer `className` on RN primitives |
| `useColorScheme` from nativewind | Use RN `useColorScheme` or app hook |
| No global.css | **Required** CSS entry + import |

## Coexistence with Gluestack (PocketOS)

| Area | Styling approach |
|------|------------------|
| `app/(app)/*` | NativeWind `className` on RN components |
| `components/onboarding/*` | Gluestack `Text` + `constants/onboarding-theme` |
| New shared UI | Prefer NativeWind unless Gluestack component is required |

Do not apply `className` to `@gluestack-ui/themed` exports without `cssInterop`.
