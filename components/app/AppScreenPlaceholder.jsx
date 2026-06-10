import { View, ScrollView } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { useI18n } from '../../lib/i18n';
import { C, S, T } from '../../constants/onboarding-theme';

/**
 * Token-aligned placeholder for app tabs not yet built.
 */
export default function AppScreenPlaceholder({ titleKey, messageKey = 'dashboard.tabComingSoon' }) {
  const { t } = useI18n();

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: S.pagePadH,
        paddingVertical: S.pagePadV,
        minHeight: 320,
      }}>
        <Text style={{ ...T.questionTitle, fontSize: 20, textAlign: 'center', marginBottom: 8 }}>
          {t(titleKey)}
        </Text>
        <Text style={{ ...T.helper, textAlign: 'center', maxWidth: 320 }}>
          {t(messageKey)}
        </Text>
      </View>
    </ScrollView>
  );
}
