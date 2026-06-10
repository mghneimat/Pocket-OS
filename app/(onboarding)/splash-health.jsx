import React from 'react';
import { useRouter } from 'expo-router';
import { useI18n } from '../../lib/i18n';
import SplashScreen from '../../components/onboarding/SplashScreen';

/** Section 6 splash — Health Insurance */
export default function SplashHealthScreen() {
  const { t } = useI18n();
  const router = useRouter();

  return (
    <SplashScreen
      heading={t('onboarding.s6.heading')}
      cta={t('common.continue')}
      onContinue={() => router.replace('/(onboarding)/health')}
      chapter={t('onboarding.health.chapter')}
      onBack={() => router.replace('/(onboarding)/transport')}
      progress={70}
    />
  );
}
