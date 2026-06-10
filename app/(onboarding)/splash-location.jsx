import React from 'react';
import { useRouter } from 'expo-router';
import { useI18n } from '../../lib/i18n';
import SplashScreen from '../../components/onboarding/SplashScreen';

/** Section 2 splash — Location & Occupation */
export default function SplashLocationScreen() {
  const { t } = useI18n();
  const router = useRouter();

  return (
    <SplashScreen
      heading={t('onboarding.s2.heading')}
      cta={t('common.continue')}
      onContinue={() => router.replace('/(onboarding)/location')}
      chapter={t('onboarding.location.chapter')}
      onBack={() => router.replace('/(onboarding)/household')}
      progress={15}
    />
  );
}
