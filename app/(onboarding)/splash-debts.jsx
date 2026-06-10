import React from 'react';
import { useRouter } from 'expo-router';
import { useI18n } from '../../lib/i18n';
import SplashScreen from '../../components/onboarding/SplashScreen';

/** Section 11 splash — Debts */
export default function SplashDebtsScreen() {
  const { t } = useI18n();
  const router = useRouter();

  return (
    <SplashScreen
      heading={t('onboarding.s11.heading')}
      cta={t('common.continue')}
      onContinue={() => router.replace('/(onboarding)/debts')}
      chapter={t('onboarding.debts.chapter')}
      onBack={() => router.replace('/(onboarding)/other-costs')}
      progress={90}
    />
  );
}
