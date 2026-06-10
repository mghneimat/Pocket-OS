import React from 'react';
import { useRouter } from 'expo-router';
import { useI18n } from '../../lib/i18n';
import SplashScreen from '../../components/onboarding/SplashScreen';

/** Section 10 splash — Other Costs */
export default function SplashOtherCostsScreen() {
  const { t } = useI18n();
  const router = useRouter();

  return (
    <SplashScreen
      heading={t('onboarding.s10.heading')}
      cta={t('common.continue')}
      onContinue={() => router.replace('/(onboarding)/other-costs')}
      chapter={t('onboarding.otherCosts.chapter')}
      onBack={() => router.replace('/(onboarding)/subscriptions')}
      progress={86}
    />
  );
}
