import React from 'react';
import { useRouter } from 'expo-router';
import { useI18n } from '../../lib/i18n';
import SplashScreen from '../../components/onboarding/SplashScreen';

/** Section 5 splash — Transport */
export default function SplashTransportScreen() {
  const { t } = useI18n();
  const router = useRouter();

  return (
    <SplashScreen
      heading={t('onboarding.s5.heading')}
      cta={t('common.continue')}
      onContinue={() => router.replace('/(onboarding)/transport')}
      chapter={t('onboarding.transport.chapter')}
      onBack={() => router.replace('/(onboarding)/housing')}
      progress={62}
    />
  );
}
