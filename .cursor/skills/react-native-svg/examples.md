# React Native SVG — Examples

Expo-focused patterns matching pocket-os (onboarding splashes, nav icons, dashboard chart, animated shapes).

## Arrow back icon (Gluestack workaround)

Replaces broken Gluestack icon with a tiny stroke icon — used in `SplashScreen.jsx` and `QuestionScreen.jsx`.

```tsx
// components/icons/ArrowLeftIcon.jsx
import Svg, { Path } from 'react-native-svg';

export default function ArrowLeftIcon({ color = '#6B7A99', size = 16 }) {
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

Usage in a pressable:

```tsx
<Pressable accessibilityLabel={t('common.back')} onPress={onBack}>
  <ArrowLeftIcon color={C.muted} size={20} />
</Pressable>
```

## Onboarding splash illustration

Abstract house graphic passed as `SplashScreen` child — `splash-housing.jsx` pattern.

```tsx
// app/(onboarding)/splash-housing.jsx (SVG excerpt)
import Svg, { Rect, Path, Circle, Text as SvgText } from 'react-native-svg';

<Svg width="200" height="160" viewBox="0 0 200 160" fill="none">
  <Rect x="50" y="70" width="100" height="75" rx="4" fill="#1D3557" opacity={0.08} />
  <Rect x="55" y="75" width="90" height="65" rx="3" fill="#1D3557" opacity={0.12} />
  <Path
    d="M40 75 L100 35 L160 75"
    stroke="#1D3557"
    strokeWidth={3}
    strokeLinecap="round"
    strokeLinejoin="round"
    fill="none"
    opacity={0.5}
  />
  <Rect x="88" y="105" width="24" height="35" rx="3" fill="#E8825A" opacity={0.35} />
  <Circle cx="170" cy="120" r="14" stroke="#3A8C6E" strokeWidth={2} fill="none" opacity={0.4} />
  <SvgText x="170" y="125" textAnchor="middle" fontSize="14" fill="#3A8C6E" opacity={0.5} fontWeight="bold">
    {t('onboarding.s4.currencySymbol')}
  </SvgText>
</Svg>
```

## Responsive placeholder banner

`PlaceholderIllustration.jsx` — fills parent when the parent has bounded height.

```tsx
import Svg, { Rect, Path, Circle, G } from 'react-native-svg';

export default function PlaceholderIllustration() {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 560 300" preserveAspectRatio="xMidYMid meet">
      <Rect width="560" height="300" fill="#F8FAFF" rx="10" />
      <Circle cx="120" cy="100" r="60" fill="rgba(37,99,235,0.06)" />
      <G opacity="0.15">
        <Rect x="180" y="80" width="200" height="240" rx="12" fill="#1E3A5F" />
        <Rect x="200" y="110" width="160" height="6" rx="3" fill="#D1DCF0" />
      </G>
      <Rect x="230" y="200" width="100" height="4" rx="2" fill="#2563EB" opacity={0.3} />
    </Svg>
  );
}

// Parent must set height:
// <View className="h-[300px] w-full"><PlaceholderIllustration /></View>
```

## Dashboard pie chart

Grouped paths with theme tokens — `dashboard.jsx` pattern.

```tsx
import Svg, { Circle, Path, Rect, G } from 'react-native-svg';
import { C } from '../../constants/onboarding-theme';

<Svg width="240" height="240" viewBox="0 0 240 240">
  <Circle cx="120" cy="120" r="100" fill={C.infoBg} />
  <Circle cx="120" cy="120" r="80" fill={C.primary} opacity={0.1} />
  <G transform="translate(120, 120)">
    <Path d="M 0,-60 A 60,60 0 0,1 52,-30 L 0,0 Z" fill={C.primary} opacity={0.8} />
    <Path d="M 52,-30 A 60,60 0 0,1 52,30 L 0,0 Z" fill={C.positive} opacity={0.8} />
    <Path d="M 52,30 A 60,60 0 0,1 0,60 L 0,0 Z" fill={C.accent} opacity={0.8} />
    <Path d="M 0,60 A 60,60 0 0,1 0,-60 L 0,0 Z" fill={C.muted} opacity={0.8} />
  </G>
</Svg>
```

## Linear gradient fill

```tsx
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';

<Svg width="200" height="80" viewBox="0 0 200 80">
  <Defs>
    <LinearGradient id="cardGrad" x1="0" y1="0" x2="1" y2="1">
      <Stop offset="0" stopColor="#2563EB" stopOpacity="0.2" />
      <Stop offset="1" stopColor="#1E3A5F" stopOpacity="0.05" />
    </LinearGradient>
  </Defs>
  <Rect x="0" y="0" width="200" height="80" rx="12" fill="url(#cardGrad)" />
</Svg>
```

## Animated stroke progress ring

Combine with `react-native-reanimated-v4`:

```tsx
import { useEffect } from 'react';
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const R = 45;
const CIRCUMFERENCE = 2 * Math.PI * R;

function ProgressRing({ progress = 0.75 }) {
  const offset = useSharedValue(CIRCUMFERENCE);

  useEffect(() => {
    offset.value = withTiming(CIRCUMFERENCE * (1 - progress), {
      duration: 800,
      easing: Easing.bezier(0.16, 1, 0.3, 1),
    });
  }, [progress]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: offset.value,
  }));

  return (
    <Svg width="120" height="120" viewBox="0 0 120 120">
      <Circle cx="60" cy="60" r={R} stroke="#E2E8F0" strokeWidth="8" fill="none" />
      <AnimatedCircle
        cx="60"
        cy="60"
        r={R}
        stroke="#2563EB"
        strokeWidth="8"
        fill="none"
        strokeDasharray={CIRCUMFERENCE}
        strokeLinecap="round"
        transform="rotate(-90 60 60)"
        animatedProps={animatedProps}
      />
    </Svg>
  );
}
```

## Import .svg file (optional — not used in pocket-os)

Only when the user needs asset files instead of inline JSX:

```bash
npm install --save-dev react-native-svg-transformer
```

`metro.config.js` — merge with existing Expo config:

```js
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
config.transformer.babelTransformerPath = require.resolve('react-native-svg-transformer');
config.resolver.assetExts = config.resolver.assetExts.filter((ext) => ext !== 'svg');
config.resolver.sourceExts = [...config.resolver.sourceExts, 'svg'];

module.exports = config;
```

```tsx
import Logo from '../assets/logo.svg';

<Logo width={120} height={40} />
```

Prefer inline JSX in pocket-os unless importing designer-delivered assets is a hard requirement.
