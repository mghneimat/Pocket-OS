import React from 'react';
import { useRouter } from 'expo-router';
import { useI18n } from '../../lib/i18n';
import SplashScreen from '../../components/onboarding/SplashScreen';

/** Section 4 splash — Housing */
export default function SplashHousingScreen() {
  const { t } = useI18n();
  const router = useRouter();

  return (
    <SplashScreen
      heading={t('onboarding.s4.heading')}
      cta={t('common.continue')}
      onContinue={() => router.replace('/(onboarding)/housing')}
      chapter={t('onboarding.housing.chapter')}
      onBack={() => router.replace('/(onboarding)/income')}
      progress={55}
    />
  );
}
