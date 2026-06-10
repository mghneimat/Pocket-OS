import { View } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { C, R, T, tabularNums } from '../../constants/onboarding-theme';
import { DASHBOARD_CARD_TONES } from './dashboardCardTones';

/**
 * Tab-level hero metric — large number on top, supporting lines below.
 * @param {'income'|'expense'|'goal'|'flexibility'|undefined} tone
 */
export default function TabHeroMetric({
  label,
  value,
  periodLabel,
  secondaryLabel,
  tertiaryLabel,
  tone,
  style,
  children,
}) {
  const palette = tone ? DASHBOARD_CARD_TONES[tone] : null;

  return (
    <View
      style={{
        backgroundColor: palette?.bg ?? C.surface,
        borderRadius: R.card,
        borderWidth: 1,
        borderColor: palette?.border ?? C.border,
        ...(palette ? { borderLeftWidth: 3, borderLeftColor: palette.accent } : {}),
        paddingHorizontal: 20,
        paddingVertical: 22,
        marginBottom: 16,
        ...style,
      }}
    >
      <Text style={{ ...T.fieldLabel, marginBottom: 8 }}>{label}</Text>
      <Text style={{
        fontSize: 40,
        lineHeight: 46,
        fontWeight: '700',
        color: palette?.valueColor ?? C.primary,
        letterSpacing: -0.02,
        ...tabularNums,
      }}>
        {value}
      </Text>
      {periodLabel ? (
        <Text style={{ ...T.caption, color: C.muted, marginTop: 6 }}>{periodLabel}</Text>
      ) : null}
      {secondaryLabel ? (
        <Text style={{ ...T.helper, color: C.muted, marginTop: 8 }}>{secondaryLabel}</Text>
      ) : null}
      {tertiaryLabel ? (
        <Text style={{ ...T.caption, color: C.muted, marginTop: 4 }}>{tertiaryLabel}</Text>
      ) : null}
      {children}
    </View>
  );
}
