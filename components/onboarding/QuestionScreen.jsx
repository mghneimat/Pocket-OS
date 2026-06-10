import { useRef, useEffect, useCallback, useMemo, useState } from 'react';
import { View, ScrollView, Pressable, Animated, Easing } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useOnboardingLayout } from '../../lib/onboardingLayout';
import { OnboardingScrollContext } from '../../lib/onboardingScroll';
import { Text } from '@gluestack-ui/themed';
import { useRouter } from 'expo-router';
import { useI18n } from '../../lib/i18n';
import { C, R, T, S } from '../../constants/onboarding-theme';
import PrimaryButton from '../ui/PrimaryButton';
import FadeUpView from './FadeUpView';
import OnboardingNavBackButton from './OnboardingNavBackButton';
import { useSectionEditOptional } from '../../lib/SectionEditContext';

/**
 * Standard question screen wrapper.
 * Provides consistent layout for all onboarding questions:
 *   nav bar → progress bar → scrollable content → fixed bottom bar.
 *
 * Updated to match UI Examples design (blue/navy palette, back button with text, etc.)
 *
 * @param {Object} props
 * @param {string} props.chapter - Chapter label (e.g. "Income & Savings")
 * @param {string} props.title - Question title
 * @param {string} [props.helper] - Helper text below title
 * @param {string} [props.description] - Longer descriptive text below the question (e.g. "This unlocks a dedicated section for children's costs.")
 * @param {React.ReactNode} props.children - Input area content
 * @param {Function} props.onContinue - Continue button handler
 * @param {Function} [props.onBack] - Custom back handler (defaults to router.back)
 * @param {Function} [props.onSkip] - Skip button handler (optional)
 * @param {string} [props.validationError] - Validation error message
 * @param {boolean} [props.continueDisabled] - Disable continue button
 * @param {number} [props.progress] - Progress 0–100 for the progress bar
 * @param {any} [props.animationKey] - When this changes, content area fades up
 * @param {string} [props.continueLabel] - Override continue button label (e.g. Save in edit mode)
 */
export default function QuestionScreen({
  chapter,
  title,
  helper,
  description,
  children,
  onContinue,
  onBack,
  onSkip,
  validationError,
  continueDisabled = false,
  progress,
  animationKey,
  continueLabel,
}) {
  const { t } = useI18n();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isEditMode = Boolean(useSectionEditOptional()?.isActive);
  const layout = useOnboardingLayout();
  const [submitting, setSubmitting] = useState(false);
  const fillAnim = useRef(new Animated.Value(progress !== undefined ? progress : 0)).current;
  const scrollRef = useRef(null);
  const contentRef = useRef(null);
  const hasProgress = progress !== undefined;

  const scrollToAnchor = useCallback((anchorRef) => {
    setTimeout(() => {
      if (!anchorRef?.current || !scrollRef.current || !contentRef.current) return;
      anchorRef.current.measureInWindow((_ax, anchorY) => {
        contentRef.current.measureInWindow((_cx, contentY) => {
          const offset = anchorY - contentY;
          scrollRef.current?.scrollTo({ y: Math.max(0, offset - 24), animated: true });
        });
      });
    }, 320);
  }, []);

  const scrollContextValue = useMemo(
    () => ({ scrollRef, contentRef, scrollToAnchor }),
    [scrollToAnchor],
  );

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
    if (onBack) {
      onBack();
    } else if (router.canGoBack && router.canGoBack()) {
      router.back();
    }
  };

  const handleContinue = async () => {
    if (submitting || continueDisabled) return;
    setSubmitting(true);
    try {
      await onContinue?.();
    } finally {
      setSubmitting(false);
    }
  };

  const isContinueDisabled = continueDisabled || submitting;

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>

      {!isEditMode ? (
        <View style={{
          backgroundColor: C.surface,
          height: S.navHeight,
          flexDirection: 'row',
          alignItems: 'center',
          borderBottomWidth: 1,
          borderBottomColor: C.border,
        }}>
          <OnboardingNavBackButton onPress={handleBack} />
          <View style={{
            position: 'absolute',
            left: 0,
            right: 0,
            alignItems: 'center',
            pointerEvents: 'none',
          }}>
            {chapter ? (
              <Text
                numberOfLines={1}
                ellipsizeMode="tail"
                style={{
                ...T.chapterLabel,
                maxWidth: layout.width - 160,
              }}>
                {chapter}
              </Text>
            ) : null}
          </View>
          <View style={{ width: 100 }} />
        </View>
      ) : null}

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

      {/* ── Scrollable content ── */}
      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1, paddingVertical: 32 }}
        keyboardShouldPersistTaps="handled"
      >
        <OnboardingScrollContext.Provider value={scrollContextValue}>
        <View
          ref={contentRef}
          collapsable={false}
          style={{
          width: '100%',
          maxWidth: S.maxWidth,
          paddingHorizontal: layout.pagePadH,
          alignSelf: 'center',
        }}>
          <FadeUpView animationKey={animationKey}>
            {/* Question title */}
            <Text
              accessibilityRole="header"
              style={{
              ...T.questionTitle,
              fontSize: layout.questionTitleSize,
              lineHeight: layout.questionTitleSize + 8,
              marginBottom: 8,
            }}>
              {title}
            </Text>

            {/* Helper text (short instruction) */}
            {helper ? (
              <View style={{
                paddingTop: 10,
                paddingBottom: 20,
                alignItems: 'flex-start',
              }}>
                <Text style={{
                  ...T.helper,
                }}>
                  {helper}
                </Text>
              </View>
            ) : null}

            {/* Description (longer contextual text below question) */}
            {description ? (
              <View style={{
                paddingTop: 16,
                paddingBottom: 10,
                marginBottom: S.sectionGap,
                alignItems: 'flex-start',
              }}>
                <Text style={{
                  ...T.caption,
                  lineHeight: 20,
                  color: C.muted,
                }}>
                  {description}
                </Text>
              </View>
            ) : null}

            {/* Input area */}
            <View style={{ marginBottom: 32 }}>
              {children}
            </View>

            {/* Validation error */}
            {validationError ? (
              <View
                accessibilityRole="alert"
                accessibilityLiveRegion="polite"
                style={{
                marginBottom: 16,
                padding: 12,
                backgroundColor: C.dangerBg,
                borderWidth: 1,
                borderColor: C.dangerBorder,
                borderRadius: R.input,
              }}>
                <Text style={{ ...T.hint, color: C.danger, lineHeight: 20 }}>
                  {validationError}
                </Text>
              </View>
            ) : null}
          </FadeUpView>
        </View>
        </OnboardingScrollContext.Provider>
      </ScrollView>

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
          <PrimaryButton
            onPress={handleContinue}
            disabled={isContinueDisabled}
            accessibilityState={{ busy: submitting, disabled: isContinueDisabled }}
          >
            {submitting ? t('common.saving') : (continueLabel || t('common.continue'))}
          </PrimaryButton>
        </View>

        {/* Skip button — below the bar */}
        {onSkip ? (
          <Pressable
            onPress={onSkip}
            accessibilityRole="button"
            accessibilityLabel={t('common.skip')}
            style={({ pressed }) => ({
              minHeight: 44,
              paddingVertical: 8,
              alignItems: 'center',
              justifyContent: 'center',
              paddingBottom: 12,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Text style={{ ...T.btnSkip }}>
              {t('common.skip')}
            </Text>
          </Pressable>
        ) : null}
      </View>

    </View>
  );
}
