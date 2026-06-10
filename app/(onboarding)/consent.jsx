import { useState, useEffect } from 'react';
import { View, Pressable, ScrollView } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { useRouter } from 'expo-router';
import { useI18n } from '../../lib/i18n';
import { isConsentAccepted, saveConsent } from '../../lib/consent';
import { C, R, T, S } from '../../constants/onboarding-theme';
import PrimaryButton from '../../components/ui/PrimaryButton';
import FadeUpView from '../../components/onboarding/FadeUpView';
import OnboardingNavBackButton from '../../components/onboarding/OnboardingNavBackButton';

export default function ConsentScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const [agreed, setAgreed] = useState(false);

  useEffect(() => {
    (async () => {
      if (await isConsentAccepted()) {
        router.replace('/(onboarding)/household');
      }
    })();
  }, []);

  const handleContinue = async () => {
    if (agreed) {
      await saveConsent();
      router.push('/(onboarding)/household');
    }
  };

  const handleBack = () => {
    router.replace('/(onboarding)/welcome');
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      {/* Header with back button */}
      <View style={{
        backgroundColor: C.surface,
        height: S.navHeight,
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: C.border,
      }}>
        <OnboardingNavBackButton onPress={handleBack} cooldown={false} />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }}>
        <View style={{
          paddingHorizontal: S.pagePadH,
          paddingVertical: 48,
          maxWidth: S.maxWidth,
          marginHorizontal: 'auto',
          width: '100%',
          flex: 1,
          justifyContent: 'center',
        }}>
          <FadeUpView>
          {/* Title */}
          <Text style={{
            ...T.questionTitle,
            marginBottom: 16,
          }}>
            {t('onboarding.consent.title')}
          </Text>

          {/* Body */}
          <Text style={{ ...T.helper, marginBottom: 32 }}>
            {t('onboarding.consent.body')}
          </Text>

          <Pressable
            onPress={() => setAgreed(!agreed)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: agreed }}
            accessibilityLabel={t('onboarding.consent.checkbox')}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'flex-start',
              marginBottom: 32,
              padding: 16,
              borderRadius: R.card,
              borderWidth: 2,
              borderColor: agreed ? C.accent : C.border,
              backgroundColor: agreed ? C.chipSelectedBg : pressed ? C.overlayHover : C.surface,
            })}
          >
            <View style={{
              width: 24,
              height: 24,
              borderRadius: 6,
              borderWidth: 2,
              marginRight: 12,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: agreed ? C.accent : 'transparent',
              borderColor: agreed ? C.accent : C.border,
            }}>
              {agreed && <Text style={{ color: C.pillSelectedText, fontSize: 14 }}>✓</Text>}
            </View>
            <Text style={{
              fontSize: 15,
              lineHeight: 22,
              flex: 1,
              color: agreed ? C.accent : C.text,
            }}>
              {t('onboarding.consent.checkbox')}
            </Text>
          </Pressable>

          <PrimaryButton
            onPress={handleContinue}
            disabled={!agreed}
            fullWidth={false}
            style={{ width: '100%' }}
          >
            {t('common.continue')}
          </PrimaryButton>
          </FadeUpView>
        </View>
      </ScrollView>
    </View>
  );
}
