import { useRef } from 'react';
import { View, PanResponder, Platform } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { useI18n } from '../../lib/i18n';
import {
  clampBudgetSpendingRatio,
  snapSpendingMonthly,
  ratioToSnappedSpending,
} from '../../lib/budgetSplit';
import { C, T } from '../../constants/onboarding-theme';

const THUMB_SIZE = 24;
const TRACK_HEIGHT = 8;

/**
 * Slide toward savings (left) or spending (right) as a 0–1 spending ratio.
 */
export default function BudgetSplitSlider({
  value = 1,
  onChange,
  totalAvailable = 0,
  disabled = false,
}) {
  const { t } = useI18n();
  const trackWidth = useRef(0);
  const base = Math.max(0, Number(totalAvailable) || 0);
  const spendingMonthly = ratioToSnappedSpending(base, value);
  const ratio = base > 0 ? spendingMonthly / base : clampBudgetSpendingRatio(value);

  const setFromX = (x) => {
    if (disabled || trackWidth.current <= 0 || base <= 0) return;
    const usable = Math.max(1, trackWidth.current - THUMB_SIZE);
    const adjusted = Math.max(0, Math.min(usable, x - THUMB_SIZE / 2));
    const rawSpending = (adjusted / usable) * base;
    const snapped = snapSpendingMonthly(base, rawSpending);
    onChange(snapped / base);
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !disabled,
      onMoveShouldSetPanResponder: () => !disabled,
      onPanResponderGrant: (evt) => setFromX(evt.nativeEvent.locationX),
      onPanResponderMove: (evt) => setFromX(evt.nativeEvent.locationX),
    }),
  ).current;

  return (
    <View
      accessibilityRole="adjustable"
      accessibilityLabel={t('onboarding.budget.q14.splitSlider.a11y')}
      accessibilityValue={{
        min: 0,
        max: 100,
        now: Math.round(ratio * 100),
        text: `${Math.round(ratio * 100)}%`,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
        <Text style={{ ...T.caption, color: C.muted }}>
          {t('onboarding.budget.q14.splitSlider.moreSavings')}
        </Text>
        <Text style={{ ...T.caption, color: C.muted }}>
          {t('onboarding.budget.q14.splitSlider.moreSpending')}
        </Text>
      </View>

      <View
        onLayout={(e) => { trackWidth.current = e.nativeEvent.layout.width; }}
        style={{ height: THUMB_SIZE + 12, justifyContent: 'center' }}
        {...panResponder.panHandlers}
      >
        <View
          style={{
            height: TRACK_HEIGHT,
            backgroundColor: C.border,
            borderRadius: TRACK_HEIGHT / 2,
            overflow: 'hidden',
          }}
        >
          <View
            style={{
              width: `${ratio * 100}%`,
              height: '100%',
              backgroundColor: C.primary,
            }}
          />
        </View>

        <View
          style={{
            position: 'absolute',
            left: `${ratio * 100}%`,
            marginLeft: -THUMB_SIZE / 2,
            width: THUMB_SIZE,
            height: THUMB_SIZE,
            borderRadius: THUMB_SIZE / 2,
            backgroundColor: C.primary,
            borderWidth: 2,
            borderColor: C.surface,
            ...(Platform.OS === 'web' && !disabled ? { cursor: 'grab' } : {}),
          }}
        />
      </View>
    </View>
  );
}
