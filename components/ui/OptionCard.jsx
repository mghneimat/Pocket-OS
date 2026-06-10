import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { C, R } from '../../constants/onboarding-theme';

/**
 * Selectable option card — blue/navy design system.
 * Gluestack Text + RN Pressable for reliable hover on web.
 */
export function OptionCard({ icon, label, subtitle, selected, onPress, style }) {
  const [hovered, setHovered] = useState(false);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={subtitle ? `${label}, ${subtitle}` : label}
      accessibilityState={{ selected }}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={({ pressed }) => ([{
        minHeight: 44,
        paddingVertical: subtitle ? 16 : 14,
        paddingHorizontal: 18,
        borderRadius: R.input,
        borderWidth: 1.5,
        borderColor: selected ? C.primary : hovered ? C.accent : C.border,
        backgroundColor: selected
          ? 'rgba(30,58,95,0.04)'
          : hovered
            ? 'rgba(37,99,235,0.04)'
            : pressed
              ? C.bg
              : C.surface,
        marginBottom: 10,
        flexDirection: 'row',
        alignItems: 'center',
      }, style])}
    >
      {icon ? (
        <Text style={{ fontSize: 20, lineHeight: 24, marginRight: 12 }}>{icon}</Text>
      ) : null}

      <View style={{ flex: 1, minWidth: 0 }}>
        <Text
          style={{
          fontSize: 15,
          color: selected ? C.primary : C.text,
          fontWeight: selected ? '600' : '400',
          lineHeight: subtitle ? 20 : 22,
        }}
          numberOfLines={3}
        >
          {label}
        </Text>
        {subtitle ? (
          <Text style={{ fontSize: 13, color: C.muted, lineHeight: 18, marginTop: 2 }} numberOfLines={3}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      {selected ? (
        <View style={{
          width: 22,
          height: 22,
          borderRadius: 11,
          backgroundColor: C.accent,
          alignItems: 'center',
          justifyContent: 'center',
          marginLeft: 10,
        }}>
          <Text style={{ color: '#FFFFFF', fontSize: 12, lineHeight: 14, fontWeight: '700' }}>
            {'✓'}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}

export default OptionCard;
