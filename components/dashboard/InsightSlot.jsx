import { View } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { C, T } from '../../constants/onboarding-theme';

/**
 * Per-section commentary slot on Summary.
 * Phase 4: pass `aiNarrative` from DeepSeek; falls back to rule-based `insight`.
 */
export default function InsightSlot({ insight, aiNarrative = null, comingSoonLabel }) {
  const text = aiNarrative || insight;
  if (!text) return null;

  return (
    <View style={{
      marginTop: 10,
      padding: 12,
      borderRadius: 8,
      backgroundColor: C.chipSelectedBg,
      borderWidth: 1,
      borderColor: C.chipSelectedBorder,
    }}>
      <Text style={{ ...T.caption, color: C.accent, fontWeight: '600', marginBottom: 4 }}>
        {comingSoonLabel}
      </Text>
      <Text style={{ fontSize: 14, lineHeight: 20, color: C.primary }}>{text}</Text>
    </View>
  );
}
