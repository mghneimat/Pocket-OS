import React from 'react';
import { useRouter } from 'expo-router';
import { useI18n } from '../../lib/i18n';
import SplashScreen from '../../components/onboarding/SplashScreen';

/** Section 3 splash — Income */
export default function SplashIncomeScreen() {
  const { t } = useI18n();
  const router = useRouter();

  return (
    <SplashScreen
      heading={t('onboarding.s3.heading')}
      cta={t('common.continue')}
      onContinue={() => router.replace('/(onboarding)/income')}
      chapter={t('onboarding.income.chapter')}
      onBack={() => router.replace('/(onboarding)/occupation')}
      progress={35}
    />
  );
}
