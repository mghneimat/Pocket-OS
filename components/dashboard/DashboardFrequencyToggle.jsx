import { View, Pressable, Platform } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { useI18n } from '../../lib/i18n';
import { C, T } from '../../constants/onboarding-theme';

const FREQ_OPTIONS = ['daily', 'weekly', 'monthly'];

/**
 * Typography-only period switch — compact, no chrome; fits ledger aesthetic.
 */
export default function DashboardFrequencyToggle({ value, onChange, style }) {
  const { t } = useI18n();

  return (
    <View
      style={[{ marginTop: 8, alignSelf: 'flex-start' }, style]}
      onStartShouldSetResponder={() => true}
      accessibilityRole="radiogroup"
      accessibilityLabel={t('common.frequency')}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
        {FREQ_OPTIONS.map((freq, index) => {
          const selected = value === freq;
          return (
            <View key={freq} style={{ flexDirection: 'row', alignItems: 'center' }}>
              {index > 0 ? (
                <Text style={{ ...T.caption, color: C.border, marginHorizontal: 8 }}>·</Text>
              ) : null}
              <Pressable
                onPress={(e) => {
                  e?.stopPropagation?.();
                  onChange(freq);
                }}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                accessibilityLabel={t(`common.${freq}`)}
                hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
                style={({ pressed }) => ({
                  paddingVertical: 2,
                  ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                {({ pressed, hovered }) => (
                  <Text style={{
                    ...T.caption,
                    fontWeight: selected ? '600' : '500',
                    color: selected ? C.primary : (pressed || hovered) ? C.primary : C.muted,
                    ...(selected ? {
                      textDecorationLine: 'underline',
                      textDecorationColor: C.primary,
                    } : {}),
                  }}>
                    {t(`common.${freq}`)}
                  </Text>
                )}
              </Pressable>
            </View>
          );
        })}
      </View>
    </View>
  );
}
