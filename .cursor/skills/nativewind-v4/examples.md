# NativeWind v4 — Examples

PocketOS-aligned patterns using `className` and `tailwind.config.js` tokens.

## Screen layout (app shell)

Matches `app/(app)/dashboard.jsx`:

```tsx
// app/(app)/example.jsx
import { ScrollView, View, Text, Pressable } from 'react-native';
import { useI18n } from '../../lib/i18n';

export default function ExampleScreen() {
  const { t } = useI18n();

  return (
    <ScrollView className="flex-1 bg-bg">
      <View className="flex-1 items-center justify-center px-5 py-12">
        <Text className="text-section text-text font-semibold text-center mb-3">
          {t('example.title')}
        </Text>
        <Text className="text-body text-muted text-center mb-8 max-w-sm">
          {t('example.subtitle')}
        </Text>
        <Pressable className="px-6 py-3 border border-border rounded-lg active:bg-chip-active">
          <Text className="text-body text-primary font-medium">
            {t('common.continue')}
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
```

## Token-first colors (not arbitrary hex)

```tsx
// ❌ Avoid when tokens exist
<Text className="text-[#1E3A5F]">Title</Text>

// ✅ Use theme tokens
<Text className="text-text font-semibold">Title</Text>
<Text className="text-muted">Helper copy</Text>
<View className="bg-surface border border-border rounded-lg p-4" />
```

## Typography scale

```tsx
<Text className="text-display text-text">Large headline</Text>
<Text className="text-section text-text font-semibold">Section title</Text>
<Text className="text-body text-muted">Body copy</Text>
<Text className="text-caption text-muted uppercase tracking-widest">Label</Text>
<Text className="text-money-large text-text">42 000 Kč</Text>
```

## Pressable states

```tsx
<Pressable
  onPress={onSubmit}
  className="w-full py-4 bg-primary rounded-lg active:bg-primary-hover disabled:opacity-40"
  disabled={!isValid}
>
  <Text className="text-body text-white text-center font-semibold">
    {t('common.continue')}
  </Text>
</Pressable>
```

## Row / list item

```tsx
<View className="flex-row items-center justify-between py-3 border-b border-divider">
  <Text className="text-body text-text flex-1">{label}</Text>
  <Text className="text-body text-muted">{value}</Text>
</View>
```

## Safe area + flex column

```tsx
import { SafeAreaView } from 'react-native-safe-area-context';

<SafeAreaView className="flex-1 bg-bg">
  <View className="flex-1 px-5 pt-4">
    {children}
  </View>
</SafeAreaView>
```

## Dark mode variant

When a parent has `dark` class or dark mode is enabled:

```tsx
<View className="flex-1 bg-bg dark:bg-bg-dark">
  <Text className="text-text dark:text-text-dark">Adapts to scheme</Text>
  <View className="border border-border dark:border-border-dark rounded-lg p-4" />
</View>
```

## Platform-specific spacing

```tsx
<View className="pt-4 ios:pt-6 android:pt-2">
  <Text className="text-body web:select-none">Content</Text>
</View>
```

## className + Reanimated

Static layout via NativeWind; motion via Reanimated `style`:

```tsx
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

const opacity = useSharedValue(0);
const fadeStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

<Animated.View className="flex-1 bg-bg px-5" style={fadeStyle}>
  <Text className="text-section text-text">Fades in</Text>
</Animated.View>
```

## Adding a new design token

1. Add to `tailwind.config.js`:

```js
// tailwind.config.js — theme.extend.colors
highlight: {
  DEFAULT: '#FEF3C7',
  dark: '#422006',
},
```

2. Use immediately:

```tsx
<View className="bg-highlight dark:bg-highlight-dark p-3 rounded-md">
  <Text className="text-body text-text">Notice</Text>
</View>
```

3. Optionally mirror in `global.css` `:root` / `.dark` for web CSS variables.

## cssInterop for a custom icon

```tsx
// lib/nativewind-setup.js — import once from app/_layout.jsx
import Svg, { Path } from 'react-native-svg';
import { cssInterop } from 'nativewind';

cssInterop(Svg, {
  className: {
    target: 'style',
    nativeStyleToProp: { color: 'fill', height: 'height', width: 'width' },
  },
});

// Usage
<Svg className="w-4 h-4 text-muted" viewBox="0 0 24 24">
  <Path d="..." fill="currentColor" />
</Svg>
```

## Onboarding vs app screens (PocketOS)

**App screen** — NativeWind:

```tsx
<View className="flex-1 bg-bg px-5">
  <Text className="text-section text-text">{title}</Text>
</View>
```

**Onboarding** — keep existing Gluestack pattern:

```tsx
import { Text } from '@gluestack-ui/themed';
import { C, T } from '../../constants/onboarding-theme';

<Text style={{ fontSize: T.section, color: C.text }}>{title}</Text>
```

Convert onboarding to NativeWind only when explicitly migrating that area.
