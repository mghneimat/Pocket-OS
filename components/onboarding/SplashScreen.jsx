import { useRef, useEffect } from 'react';
import { View, Animated, Easing } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useOnboardingLayout } from '../../lib/onboardingLayout';
import { Text } from '@gluestack-ui/themed';
import { useRouter } from 'expo-router';
import { C, R, T, S } from '../../constants/onboarding-theme';
import PrimaryButton from '../ui/PrimaryButton';
import FadeUpView from './FadeUpView';
import OnboardingNavBackButton from './OnboardingNavBackButton';

/**
 * Full-screen section intro splash screen.
 * Nav bar, progress bar, heading, and continue CTA.
 *
 * @param {Object} props
 * @param {string} props.heading - Main heading (1–2 lines)
 * @param {string} props.cta - CTA button label
 * @param {Function} props.onContinue - Continue handler
 * @param {string} [props.chapter] - Chapter label shown in nav bar (optional)
 * @param {Function} [props.onBack] - Back button handler (shows back button if provided)
 * @param {number} [props.progress] - Progress 0–100 for the progress bar
 */
export default function SplashScreen({
  heading,
  cta,
  onContinue,
  chapter,
  onBack,
  progress,
}) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const layout = useOnboardingLayout();
  const fillAnim = useRef(new Animated.Value(progress !== undefined ? progress : 0)).current;
  const hasProgress = progress !== undefined;

  useEffect(() => {
    if (hasProgress) {
      Animated.timing(fillAnim, {
        toValue: Math.min(100, Math.max(0, progress)),
        duration: 400,
        easing: Easing.bezier(0.16, 1, 0.3, 1),
        useNativeDriver: false,
      }).start();
    }
  }, [progress, hasProgress]);

  const handleBack = () => {
    if (onBack) { onBack(); } else { router.back(); }
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>

      {/* ── Nav bar ── */}
      <View style={{
        backgroundColor: C.surface,
        height: S.navHeight,
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: C.border,
      }}>
        {/* Back arrow — top left (only shown when onBack is provided) */}
        {onBack ? (
          <OnboardingNavBackButton onPress={handleBack} cooldown={false} />
        ) : (
          <View style={{ width: 100 }} />
        )}

        {/* Chapter title — centered */}
        <View style={{
          position: 'absolute',
          left: 0,
          right: 0,
          alignItems: 'center',
          pointerEvents: 'none',
        }}>
          {chapter ? (
            <Text style={{
              ...T.chapterLabel,
            }}>
              {chapter}
            </Text>
          ) : null}
        </View>

        {/* Right spacer */}
        <View style={{ width: 100 }} />
      </View>

      {/* ── Progress bar (thin line under nav bar) ── */}
      {hasProgress ? (
        <View
          accessibilityRole="progressbar"
          accessibilityValue={{ min: 0, max: 100, now: Math.round(progress) }}
          style={{
          height: S.progressHeight,
          backgroundColor: C.progressTrack,
        }}>
          <Animated.View style={{
            height: '100%',
            width: fillAnim.interpolate({
              inputRange: [0, 100],
              outputRange: ['0%', '100%'],
            }),
            backgroundColor: C.progressFill,
          }} />
        </View>
      ) : null}

      {/* ── Centered content ── */}
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: layout.pagePadH }}>
        <View style={{
          width: '100%',
          maxWidth: S.maxWidth,
        }}>
          <FadeUpView duration={320} translateY={10} style={{ width: '100%' }}>
            <Text
              accessibilityRole="header"
              style={{
              ...T.splashHeading,
              textAlign: 'left',
            }}>
              {heading}
            </Text>
          </FadeUpView>
        </View>
      </View>

      {/* ── Bottom bar (fixed, matching UI Examples) ── */}
      <View style={{
        backgroundColor: C.surface,
        borderTopWidth: 1,
        borderTopColor: C.border,
        paddingBottom: Math.max(insets.bottom, 0),
      }}>
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          minHeight: 74,
          paddingHorizontal: layout.pagePadH,
          maxWidth: S.maxWidth,
          width: '100%',
          alignSelf: 'center',
        }}>
          <PrimaryButton onPress={onContinue}>{cta}</PrimaryButton>
        </View>
      </View>

    </View>
  );
}
