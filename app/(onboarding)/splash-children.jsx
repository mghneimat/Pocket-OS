import React from 'react';
import { useRouter } from 'expo-router';
import { useI18n } from '../../lib/i18n';
import SplashScreen from '../../components/onboarding/SplashScreen';

/** Section 7 splash — Children's Costs */
export default function SplashChildrenScreen() {
  const { t } = useI18n();
  const router = useRouter();

  return (
    <SplashScreen
      heading={t('onboarding.s7.heading')}
      cta={t('common.continue')}
      onContinue={() => router.replace('/(onboarding)/children-costs')}
      chapter={t('onboarding.childrenCosts.chapter')}
      onBack={() => router.replace('/(onboarding)/health')}
      progress={75}
    />
  );
}
