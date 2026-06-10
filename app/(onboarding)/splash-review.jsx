import React from 'react';
import { useRouter } from 'expo-router';
import { useI18n } from '../../lib/i18n';
import SplashScreen from '../../components/onboarding/SplashScreen';

/** Section 13 splash — Review */
export default function SplashReviewScreen() {
  const { t } = useI18n();
  const router = useRouter();

  return (
    <SplashScreen
      heading={t('onboarding.s13.heading')}
      cta={t('common.continue')}
      onContinue={() => router.replace('/(onboarding)/review')}
      chapter={t('onboarding.review.chapter')}
      onBack={() => router.replace('/(onboarding)/budget')}
      progress={96}
    />
  );
}
