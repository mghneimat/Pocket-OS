import { useState } from 'react';
import { Pressable } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { C, R, T } from '../../constants/onboarding-theme';

/**
 * Onboarding-styled primary CTA — gluestack Text + Pressable for hover/press control.
 */
export function PrimaryButton({
  children,
  onPress,
  disabled = false,
  fullWidth = true,
  variant = 'primary',
  style,
  textStyle,
  accessibilityState,
  accessibilityLabel,
}) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);

  const bgColor = disabled
    ? C.disabled
    : variant === 'outline'
    ? 'transparent'
    : pressed
    ? C.accentPressed
    : C.accent;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? (typeof children === 'string' ? children : undefined)}
      accessibilityState={accessibilityState}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={[
        {
          flex: fullWidth ? 1 : undefined,
          paddingVertical: 16,
          paddingHorizontal: 24,
          borderRadius: R.button,
          backgroundColor: bgColor,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: hovered && !disabled ? 0.92 : 1,
          borderWidth: variant === 'outline' ? 1.5 : 0,
          borderColor: variant === 'outline' ? C.border : 'transparent',
        },
        style,
      ]}
    >
      <Text
        style={[
          variant === 'outline' ? T.btnSkip : { ...T.btnPrimary, color: C.pillSelectedText },
          textStyle,
        ]}
      >
        {children}
      </Text>
    </Pressable>
  );
}

export default PrimaryButton;
