import { View, Pressable } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { C, R, T } from '../../constants/onboarding-theme';
import SurfaceCard from '../ui/SurfaceCard';

/**
 * Dashboard AI teaser card.
 * Phase 4: call fetchAINarrative() from lib/aiInsights.js and pass result as `insight`.
 * Keep the same component and onPress → Summary.
 */
export default function AIInsightCard({
  title,
  insight,
  ctaLabel,
  onPress,
  accessibilityLabel,
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => ({ opacity: pressed ? 0.92 : 1, marginBottom: 16 })}
    >
      <SurfaceCard style={{ backgroundColor: C.chipSelectedBg, borderColor: C.chipSelectedBorder }}>
        <Text style={{ fontSize: 13, fontWeight: '600', color: C.accent, marginBottom: 8 }}>
          {title}
        </Text>
        <Text style={{ ...T.body, color: C.primary, marginBottom: 16 }}>
          {insight}
        </Text>
        <View style={{
          alignSelf: 'flex-start',
          paddingVertical: 10,
          paddingHorizontal: 16,
          borderRadius: R.button,
          backgroundColor: C.accent,
          minHeight: 44,
          justifyContent: 'center',
        }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#FFFFFF' }}>{ctaLabel}</Text>
        </View>
      </SurfaceCard>
    </Pressable>
  );
}
