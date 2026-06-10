import React from 'react';
import { useRouter } from 'expo-router';
import { useI18n } from '../../lib/i18n';
import SplashScreen from '../../components/onboarding/SplashScreen';

/** Section 9 splash — Subscriptions */
export default function SplashSubscriptionsScreen() {
  const { t } = useI18n();
  const router = useRouter();

  return (
    <SplashScreen
      heading={t('onboarding.s9.heading')}
      cta={t('common.continue')}
      onContinue={() => router.replace('/(onboarding)/subscriptions')}
      chapter={t('onboarding.subscriptions.chapter')}
      onBack={() => router.replace('/(onboarding)/pets')}
      progress={83}
    />
  );
}
