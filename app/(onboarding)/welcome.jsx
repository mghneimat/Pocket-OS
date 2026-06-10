import React from 'react';
import { View } from 'react-native';
import { Box, Text } from '@gluestack-ui/themed';
import PrimaryButton from '../../components/ui/PrimaryButton';
import { useRouter } from 'expo-router';
import { useI18n } from '../../lib/i18n';
import { isConsentAccepted } from '../../lib/consent';
import { C, R, T, S } from '../../constants/onboarding-theme';
import FadeUpView from '../../components/onboarding/FadeUpView';

export default function WelcomeScreen() {
  const { t } = useI18n();
  const router = useRouter();

  const handleGetStarted = async () => {
    if (await isConsentAccepted()) {
      router.push('/(onboarding)/household');
    } else {
      router.push('/(onboarding)/consent');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center', paddingHorizontal: S.pagePadH }}>
      <FadeUpView style={{ alignItems: 'center', width: '100%', maxWidth: S.maxWidth }}>
        {/* Brand title */}
        <Box style={{ marginBottom: 28, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ ...T.displayBrand, fontWeight: '700', letterSpacing: -1 }}>
            {t('app.name')}
          </Text>
        </Box>

        {/* Motto */}
        <Text style={{ ...T.welcomeTagline, textAlign: 'center', marginBottom: 12 }}>
          {t('app.tagline')}
        </Text>

        <Text
          style={{ ...T.welcomeBody, textAlign: 'center', marginBottom: 32, paddingHorizontal: 24, maxWidth: 360 }}
        >
          {t('app.description')}
        </Text>

        <PrimaryButton
          onPress={handleGetStarted}
          fullWidth={false}
          style={{ width: '100%' }}
        >
          {t('onboarding.welcome.cta')}
        </PrimaryButton>
      </FadeUpView>
    </View>
  );
}
