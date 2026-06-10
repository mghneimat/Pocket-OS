import { useState } from 'react';
import { View, Text, Pressable, Platform } from 'react-native';
import Animated from 'react-native-reanimated';
import { C, R } from '../../constants/onboarding-theme';
import { LanguagesIcon } from './AppNavIcons';
import { elevationShadow } from '../../lib/shadow';

/** Match AppSidebar nav row geometry — icon must never shift or vanish on collapse */
const ICON_SLOT = 36;
const NAV_ICON_SIZE = 16;
const ROW_HEIGHT = 44;
const ROW_MARGIN_H = 8;
const ROW_MARGIN_V = 2;
const ROW_PAD_LEFT = 6;
const LABEL_LEFT = ROW_PAD_LEFT + ICON_SLOT + 4;
const OPTION_H = 46;

const iconSlotStyle = {
  width: ICON_SLOT,
  height: ICON_SLOT,
  flexShrink: 0,
  alignItems: 'center',
  justifyContent: 'center',
  ...(Platform.OS === 'web' ? { transform: [{ translateZ: 0 }] } : {}),
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const LANGUAGES = [
  { code: 'en', displayCode: 'EN', label: 'English', flag: '🇬🇧' },
  { code: 'cs', displayCode: 'CS', label: 'Čeština', flag: '🇨🇿' },
];

function LanguageFlag({ flag, size = 24 }) {
  return (
    <View style={{
      width: size,
      height: size,
      borderRadius: size / 2,
      backgroundColor: C.bg,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: C.border,
    }}>
      <Text style={{ fontSize: size * 0.58, lineHeight: size * 0.72 }}>{flag}</Text>
    </View>
  );
}

function LanguageOptionRow({ displayCode, flag, label, selected, onPress }) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);

  const backgroundColor = selected || pressed
    ? C.chipSelectedBg
    : hovered
      ? C.overlayHover
      : 'transparent';

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="menuitem"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        minHeight: OPTION_H,
        paddingHorizontal: 14,
        paddingVertical: 8,
        backgroundColor,
        ...(Platform.OS === 'web' ? { cursor: 'pointer', transition: 'background-color 0.15s ease' } : {}),
      }}
    >
      <Text style={{
        width: 28,
        fontSize: 12,
        fontWeight: '700',
        color: C.muted,
        letterSpacing: 0.6,
      }}>
        {displayCode}
      </Text>
      <LanguageFlag flag={flag} />
      <Text style={{
        flex: 1,
        marginLeft: 12,
        fontSize: 14,
        fontWeight: selected ? '600' : '400',
        color: selected ? C.primary : C.text,
      }}>
        {label}
      </Text>
    </Pressable>
  );
}

export default function LanguageSelector({
  locale,
  open,
  onToggle,
  onSelect,
  triggerLabel,
  labelAnimatedStyle,
  rowPadAnimatedStyle,
  showTooltip = false,
  panelStyle,
  insetStyle,
}) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);

  const backgroundColor = open
    ? C.chipSelectedBg
    : pressed
      ? C.overlayPressed
      : hovered
        ? C.overlayHover
        : 'transparent';

  const iconColor = open ? C.primary : C.muted;
  const a11yLabel = triggerLabel;

  return (
    <View style={{ marginBottom: 4 }}>
      <AnimatedPressable
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityLabel={a11yLabel}
        accessibilityState={{ expanded: open }}
        {...(Platform.OS === 'web' && showTooltip ? { title: a11yLabel } : {})}
        onPressIn={() => setPressed(true)}
        onPressOut={() => setPressed(false)}
        onHoverIn={() => setHovered(true)}
        onHoverOut={() => setHovered(false)}
        style={[
          {
            position: 'relative',
            flexDirection: 'row',
            alignItems: 'center',
            minHeight: ROW_HEIGHT,
            marginHorizontal: ROW_MARGIN_H,
            marginVertical: ROW_MARGIN_V,
            paddingLeft: ROW_PAD_LEFT,
            paddingRight: 8,
            borderRadius: R.input,
            backgroundColor,
            ...(Platform.OS === 'web' ? { cursor: 'pointer', transition: 'background-color 0.15s ease' } : {}),
          },
          rowPadAnimatedStyle,
        ]}
      >
        <View style={iconSlotStyle} collapsable={false}>
          <LanguagesIcon color={iconColor} size={NAV_ICON_SIZE} />
        </View>
        {labelAnimatedStyle ? (
          <Animated.View
            style={[
              {
                position: 'absolute',
                left: LABEL_LEFT,
                right: 8,
                top: 0,
                bottom: 0,
                justifyContent: 'center',
                pointerEvents: 'none',
              },
              labelAnimatedStyle,
            ]}
          >
            <Text
              numberOfLines={1}
              style={{
                fontSize: 14,
                fontWeight: open ? '600' : '500',
                color: open ? C.primary : C.muted,
              }}
            >
              {triggerLabel}
            </Text>
          </Animated.View>
        ) : (
          <View style={{ flex: 1, marginLeft: 4 }}>
            <Text
              numberOfLines={1}
              style={{
                fontSize: 14,
                fontWeight: open ? '600' : '500',
                color: open ? C.primary : C.muted,
              }}
            >
              {triggerLabel}
            </Text>
          </View>
        )}
      </AnimatedPressable>

      <Animated.View style={[{ marginHorizontal: ROW_MARGIN_H }, panelStyle]}>
        <Animated.View style={[{ alignItems: 'center', paddingTop: 6 }, insetStyle]}>
          <View style={{
            width: 0,
            height: 0,
            borderLeftWidth: 7,
            borderRightWidth: 7,
            borderBottomWidth: 7,
            borderLeftColor: 'transparent',
            borderRightColor: 'transparent',
            borderBottomColor: C.surface,
            marginBottom: -1,
          }} />
          <View style={{
            width: '100%',
            backgroundColor: C.surface,
            borderRadius: R.chip,
            paddingVertical: 6,
            ...elevationShadow({ offsetY: 6, blur: 16, opacity: 0.12 }),
            ...(Platform.OS !== 'web' ? { borderWidth: 1, borderColor: C.border } : {}),
          }}>
            {LANGUAGES.map((lang) => (
              <LanguageOptionRow
                key={lang.code}
                displayCode={lang.displayCode}
                flag={lang.flag}
                label={lang.label}
                selected={locale === lang.code}
                onPress={() => onSelect(lang.code)}
              />
            ))}
          </View>
        </Animated.View>
      </Animated.View>
    </View>
  );
}
