import { View } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { useI18n } from '../../lib/i18n';
import { C, R, T } from '../../constants/onboarding-theme';

/** Read-only AI / rule-based insight card for tab screens. */
export default function SectionAIInsightCard({ insight, titleKey = 'dashboard.insights.sectionTitle' }) {
  const { t } = useI18n();
  if (!insight) return null;

  return (
    <View style={{
      marginBottom: 16,
      padding: 16,
      borderRadius: R.card,
      backgroundColor: C.chipSelectedBg,
      borderWidth: 1,
      borderColor: C.chipSelectedBorder,
    }}>
      <Text style={{ fontSize: 13, fontWeight: '600', color: C.accent, marginBottom: 8 }}>
        {t(titleKey)}
      </Text>
      <Text style={{ ...T.body, color: C.primary }}>{insight}</Text>
    </View>
  );
}
