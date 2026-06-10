import React from 'react';
import { useRouter } from 'expo-router';
import { useI18n } from '../../lib/i18n';
import SplashScreen from '../../components/onboarding/SplashScreen';

/** Section 12 splash — Budget & Strategy */
export default function SplashBudgetScreen() {
  const { t } = useI18n();
  const router = useRouter();

  return (
    <SplashScreen
      heading={t('onboarding.s12.heading')}
      cta={t('common.continue')}
      onContinue={() => router.replace('/(onboarding)/budget')}
      chapter={t('onboarding.budget.chapter')}
      onBack={() => router.replace('/(onboarding)/debts')}
      progress={93}
    />
  );
}
