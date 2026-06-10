import { useState } from 'react';
import { View, TextInput, Platform } from 'react-native';
import { webFocusRing } from '../../lib/a11y';
import {
  FormControl,
  FormControlLabel,
  FormControlLabelText,
  FormControlHelper,
  FormControlHelperText,
  FormControlError,
  FormControlErrorText,
  Text,
} from '@gluestack-ui/themed';
import { C, T, S, R } from '../../constants/onboarding-theme';

/**
 * Gluestack-backed labeled input — full parity with legacy LabeledInput.
 * Uses FormControl for label/error; TextInput for reliable border-radius on web.
 */
export function FormInput({
  label,
  required = false,
  optional = false,
  value,
  onChangeText,
  placeholder,
  placeholderTextColor,
  numeric = false,
  large = false,
  inCard = false,
  currency,
  frequency,
  maxLength,
  multiline = false,
  inputStyle,
  containerStyle,
  helperText,
  errorText,
  disabled = false,
  size = 'md',
  inGroup = false,
  accessibilityLabel,
}) {
  const [focused, setFocused] = useState(false);
  const hasCurrency = !!currency;
  const isInvalid = !!errorText;
  const borderW = inCard ? 2 : 2.5;

  const groupedLargeBg = inGroup ? 'transparent' : C.surface;

  const containerBase = inCard
    ? {
        backgroundColor: C.bg,
        borderWidth: borderW,
        borderColor: C.border,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
      }
    : large
    ? {
        backgroundColor: groupedLargeBg,
        borderWidth: borderW,
        borderColor: C.border,
        borderRadius: R.input,
        paddingHorizontal: 14,
        paddingVertical: 8,
      }
    : {
        backgroundColor: C.surface,
        borderWidth: borderW,
        borderColor: C.border,
        borderRadius: R.input,
        paddingHorizontal: 16,
        paddingVertical: 14,
      };

  const currencyStyle = large
    ? { fontSize: 18, lineHeight: 26, fontWeight: '600', color: C.muted }
    : inCard
    ? { fontSize: 15, lineHeight: 22, fontWeight: '500', color: C.muted }
    : { fontSize: 17, lineHeight: 24, fontWeight: '500', color: C.muted };

  const freqStyle = large
    ? { fontSize: 13, lineHeight: 20, fontWeight: '500', color: C.muted, paddingRight: frequency ? 4 : 0 }
    : inCard
    ? { fontSize: 12, lineHeight: 18, fontWeight: '400', color: C.muted }
    : { fontSize: 13, lineHeight: 20, fontWeight: '400', color: C.muted };

  const inputBase = inCard
    ? {
        backgroundColor: C.bg,
        borderWidth: 1,
        borderColor: C.border,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 15,
        color: C.text,
      }
    : large
    ? {
        backgroundColor: groupedLargeBg,
        borderWidth: 1.5,
        borderColor: C.border,
        borderRadius: R.input,
        paddingHorizontal: 14,
        paddingVertical: 8,
        color: C.text,
        fontSize: 22,
        fontWeight: '600',
      }
    : {
        backgroundColor: C.surface,
        borderWidth: 1.5,
        borderColor: C.border,
        borderRadius: R.input,
        paddingHorizontal: 16,
        paddingVertical: 14,
        color: C.text,
        fontSize: 17,
        fontWeight: '400',
      };

  const renderInput = () => {
    if (hasCurrency) {
      return (
        <View
          style={[
            containerBase,
            {
              flexDirection: 'row',
              alignItems: 'center',
              gap: large ? 8 : 6,
              borderColor: focused ? C.accent : isInvalid ? C.danger : C.border,
              borderWidth: borderW,
              opacity: disabled ? 0.6 : 1,
            },
          ]}
        >
          <Text style={currencyStyle}>{currency}</Text>
          <TextInput
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor={placeholderTextColor ?? C.placeholder}
            keyboardType={numeric ? 'numeric' : 'default'}
            maxLength={maxLength}
            multiline={multiline}
            editable={!disabled}
            accessibilityLabel={accessibilityLabel ?? label}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            style={[
              inCard
                ? { fontSize: 15, color: C.text, paddingVertical: 0 }
                : large
                ? { fontSize: 22, fontWeight: '600', color: C.text, paddingVertical: 0 }
                : { fontSize: 17, fontWeight: '400', color: C.text, paddingVertical: 0 },
              {
                flex: 1,
                paddingVertical: 0,
                outlineStyle: 'none',
                outlineWidth: 0,
                ...(Platform.OS === 'web' ? { outline: 'none', boxShadow: 'none' } : {}),
              },
              inputStyle,
            ]}
          />
          {frequency ? <Text style={freqStyle}>{frequency}</Text> : null}
        </View>
      );
    }

    return (
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={placeholderTextColor ?? C.placeholder}
        keyboardType={numeric ? 'numeric' : 'default'}
        maxLength={maxLength}
        multiline={multiline}
        editable={!disabled}
        accessibilityLabel={accessibilityLabel ?? label}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={[
          inputBase,
          {
            borderColor: focused ? C.accent : isInvalid ? C.danger : C.border,
            borderWidth: borderW,
            outlineStyle: 'none',
            outlineWidth: 0,
            opacity: disabled ? 0.6 : 1,
            ...(Platform.OS === 'web' ? { minHeight: large ? 48 : 44 } : {}),
          },
          webFocusRing(focused),
          inputStyle,
        ]}
      />
    );
  };

  return (
    <FormControl
      isInvalid={isInvalid}
      isDisabled={disabled}
      size={size}
      style={[{ marginBottom: inGroup ? 0 : 16 }, containerStyle]}
    >
      {label ? (
        <FormControlLabel style={{ marginBottom: S.labelGap }}>
          <FormControlLabelText style={T.fieldLabel}>
            {label}
            {required ? (
              <FormControlLabelText style={{ color: C.accent }}>{' *'}</FormControlLabelText>
            ) : null}
            {optional ? (
              <FormControlLabelText style={{ fontWeight: '400', fontSize: 11, color: C.muted }}>
                {' (optional)'}
              </FormControlLabelText>
            ) : null}
          </FormControlLabelText>
        </FormControlLabel>
      ) : null}

      {renderInput()}

      {helperText && !isInvalid ? (
        <FormControlHelper>
          <FormControlHelperText style={T.hint}>{helperText}</FormControlHelperText>
        </FormControlHelper>
      ) : null}

      {errorText ? (
        <FormControlError>
          <FormControlErrorText style={{ color: C.danger, fontSize: 13 }}>
            {errorText}
          </FormControlErrorText>
        </FormControlError>
      ) : null}
    </FormControl>
  );
}

export default FormInput;
