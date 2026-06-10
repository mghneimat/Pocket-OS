import React, { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useI18n } from '../../lib/i18n';
import { getData } from '../../lib/storage';
import SplashScreen from '../../components/onboarding/SplashScreen';

/** Section 8 splash — Pets */
export default function SplashPetsScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const [onBackRoute, setOnBackRoute] = useState('/(onboarding)/health');

  useEffect(() => {
    (async () => {
      const household = await getData('pocketos_household');
      setOnBackRoute(
        household?.children?.length > 0
          ? '/(onboarding)/children-costs'
          : '/(onboarding)/health',
      );
    })();
  }, []);

  return (
    <SplashScreen
      heading={t('onboarding.s8.heading')}
      cta={t('common.continue')}
      onContinue={() => router.replace('/(onboarding)/pets')}
      chapter={t('onboarding.pets.chapter')}
      onBack={() => router.replace(onBackRoute)}
      progress={80}
    />
  );
}
