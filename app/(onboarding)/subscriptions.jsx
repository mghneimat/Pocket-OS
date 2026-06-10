import { useState, useEffect, useRef } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useI18n } from '../../lib/i18n';
import { getData, setData } from '../../lib/storage';
import { getCurrencySymbol } from '../../lib/currency';
import { toMonthly, formatCurrency } from '../../lib/finance';
import { C, S, T, R } from '../../constants/onboarding-theme';
import QuestionScreen from '../../components/onboarding/QuestionScreen';
import PillToggle from '../../components/onboarding/PillToggle';
import DatePicker from '../../components/onboarding/DatePicker';
import { SERVICE_ICON_COMPONENTS } from '../../components/onboarding/ServiceIcons';
import AnimatedSlideIn from '../../components/onboarding/AnimatedSlideIn';
import LabeledInput from '../../components/onboarding/LabeledInput';
import FrequencyPills from '../../components/onboarding/FrequencyPills';
import InputGroup from '../../components/onboarding/InputGroup';
import CostCard from '../../components/onboarding/CostCard';
import { useSectionExit } from '../../lib/finishOnboardingSection';

const QUICK_ADD_CHIPS = [
  'netflix', 'primeVideo', 'disneyPlus', 'appleTvPlus', 'hboMax',
  'spotify', 'appleMusic', 'youtubePremium', 'deezer',
  'revolut', 'wise', 'icloudPlus', 'googleOne',
  'microsoft365', 'adobeCC', 'playstationPlus', 'xboxGamePass',
  'other',
];

const FREQUENCIES = ['monthly', 'quarterly', 'annual'];

export default function SubscriptionsScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const { isEditMode, completeSection, leaveSection, editContinueLabel } = useSectionExit();

  // ── Loaded data ──
  const [currencyCode, setCurrencyCode] = useState('CZK');
  const currency = getCurrencySymbol(currencyCode);

  const [validationError, setValidationError] = useState('');
  const [subscriptions, setSubscriptions] = useState([]);
  const [visibleSubs, setVisibleSubs] = useState({});
  const [removingSubs, setRemovingSubs] = useState(new Set());

  // ── Load currency from location data ──
  useEffect(() => {
    (async () => {
      const loc = await getData('pocketos_location');
      if (loc?.currency) setCurrencyCode(loc.currency);
    })();
  }, []);

  const addSubscription = (name) => {
    const newIdx = subscriptions.length;
    setSubscriptions([...subscriptions, {
      name,
      cost: '',
      frequency: 'monthly',
      autoRenews: true,
      renewalDate: '',
    }]);
    // Start hidden, then animate in on next tick
    setVisibleSubs(prev => ({ ...prev, [newIdx]: false }));
    setTimeout(() => {
      setVisibleSubs(prev => ({ ...prev, [newIdx]: true }));
    }, 50);
  };

  const updateSub = (idx, updates) => {
    const updated = [...subscriptions];
    updated[idx] = { ...updated[idx], ...updates };
    setSubscriptions(updated);
  };

  const removeSub = (idx) => {
    const name = subscriptions[idx]?.name;
    if (name) {
      // Keep chip visually active during card animation
      setRemovingSubs(prev => new Set(prev).add(name));
    }
    // Animate out first, then remove after animation
    setVisibleSubs(prev => ({ ...prev, [idx]: false }));
    setTimeout(() => {
      setSubscriptions(prev => prev.filter((_, i) => i !== idx));
      setRemovingSubs(prev => {
        const next = new Set(prev);
        next.delete(name);
        return next;
      });
    }, 300);
  };

  const hasSub = (name) => subscriptions.some(s => s.name === name) || removingSubs.has(name);

  const toggleSubscription = (name) => {
    if (hasSub(name)) {
      const idx = subscriptions.findIndex(s => s.name === name);
      if (idx !== -1) removeSub(idx);
    } else {
      addSubscription(name);
    }
  };

  const handleContinue = async () => {
    setValidationError('');

    // Validate all subs have cost
    for (let i = 0; i < subscriptions.length; i++) {
      if (!subscriptions[i].cost) {
        setValidationError(t('onboarding.subscriptions.q11.validation'));
        return;
      }
    }

    await completeSection({
      persist: async () => { await setData('pocketos_subscriptions', subscriptions); },
      onboardingPatch: { completed: false, currentStep: 'subscriptions', percentComplete: 85 },
      nextRoute: '/(onboarding)/splash-other-costs',
    });
  };

  const progress = 85;
  const screenProgress = isEditMode ? undefined : progress;

  // Count streaming services
  const streamingServices = ['netflix', 'primeVideo', 'disneyPlus', 'appleTvPlus', 'hboMax', 'spotify', 'appleMusic', 'youtubePremium', 'deezer'];
  const streamingCount = subscriptions.filter(s => streamingServices.includes(s.name)).length;
  const streamingMonthlyTotal = subscriptions
    .filter(s => streamingServices.includes(s.name))
    .reduce((sum, s) => sum + toMonthly(parseFloat(s.cost) || 0, s.frequency), 0);

  return (
    <QuestionScreen
      chapter={t('onboarding.subscriptions.chapter')}
      title={t('onboarding.subscriptions.q11.title')}
      helper={t('onboarding.subscriptions.q11.helper')}
      onContinue={handleContinue}
      onBack={() => leaveSection(() => router.replace('/(onboarding)/splash-subscriptions'))}
      validationError={validationError}
      progress={screenProgress}
      continueLabel={editContinueLabel}
    >
      {/* Quick-add chips — toggle style with icons */}
      <Text style={{ ...T.fieldLabel, color: C.muted, marginBottom: 10 }}>
        {t('onboarding.subscriptions.q11.quickAdd')}
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20, width: '100%' }}>
        {QUICK_ADD_CHIPS.map(name => {
          const isActive = hasSub(name);
          return (
            <Pressable
              key={name}
              onPress={() => toggleSubscription(name)}
              style={({ pressed }) => ({
                paddingVertical: 10,
                paddingHorizontal: 14,
                borderRadius: 12,
                borderWidth: 1.5,
                borderColor: isActive ? C.primary : pressed ? C.placeholder : C.border,
                backgroundColor: isActive
                  ? C.chipSelectedBg
                  : pressed
                    ? C.bg
                    : C.surface,
                flexDirection: 'row',
                alignItems: 'center',
              })}
            >
              {(() => {
                const IconComponent = SERVICE_ICON_COMPONENTS[name];
                return IconComponent ? <IconComponent /> : null;
              })()}
              <View style={{ width: 6 }} />
              <Text style={{
                fontSize: 13,
                fontWeight: isActive ? '600' : '500',
                color: isActive ? C.primary : C.muted,
                marginRight: isActive ? 6 : 0,
              }}>
                {t(`onboarding.subscriptions.q11.services.${name}`)}
              </Text>
              {isActive && (
                <View style={{
                  width: 18,
                  height: 18,
                  borderRadius: 9,
                  backgroundColor: C.primary,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '700' }}>{'✓'}</Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </View>

      {/* Subscription cards */}
      {subscriptions.map((sub, idx) => (
        <AnimatedSlideIn key={idx} visible={visibleSubs[idx] !== false}>
          <CostCard
            title={t(`onboarding.subscriptions.q11.services.${sub.name}`)}
            onRemove={() => removeSub(idx)}
          >
            <InputGroup nested>
              <LabeledInput
                label={t('onboarding.subscriptions.q11.amountLabel')}
                value={sub.cost}
                onChangeText={(v) => updateSub(idx, { cost: v })}
                numeric
                placeholder={t('onboarding.subscriptions.q11.amountPlaceholder')}
                large
                inGroup
                currency={currency}
              />
              <FrequencyPills
                options={FREQUENCIES}
                value={sub.frequency}
                onChange={(freq) => updateSub(idx, { frequency: freq })}
                small
              />
            </InputGroup>

            {/* Auto-renews toggle */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <Text style={{ ...T.caption, color: C.muted }}>{t('onboarding.subscriptions.q11.autoRenewLabel')}</Text>
              <Pressable
                onPress={() => updateSub(idx, { autoRenews: !sub.autoRenews })}
                style={{
                  paddingVertical: 4, paddingHorizontal: 12, borderRadius: 6,
                  backgroundColor: sub.autoRenews ? C.chipSelectedBg : C.bg,
                }}
              >
                <Text style={{ fontSize: 12, color: sub.autoRenews ? C.primary : C.muted, fontWeight: '500' }}>
                  {sub.autoRenews ? t('common.yes') : t('common.no')}
                </Text>
              </Pressable>
            </View>

            {/* Renewal date */}
            <Text style={{ ...T.fieldLabel, color: C.muted, marginBottom: S.labelGap }}>
              {t('onboarding.subscriptions.q11.renewalLabel')}
            </Text>
            <DatePicker
              value={sub.renewalDate}
              onChange={(v) => updateSub(idx, { renewalDate: v })}
            />
          </CostCard>
        </AnimatedSlideIn>
      ))}

      {/* Streaming flag */}
      <AnimatedSlideIn visible={streamingCount >= 3}>
        <View style={{ padding: 12, backgroundColor: 'rgba(245,158,11,0.08)', borderRadius: 8, borderWidth: 1, borderColor: 'rgba(245,158,11,0.2)' }}>
          <Text style={{ fontSize: 13, color: '#92400E', lineHeight: 20 }}>
            {t('onboarding.subscriptions.q11.streamingFlag', { count: streamingCount, amount: formatCurrency(streamingMonthlyTotal, 'CZK') })}
          </Text>
        </View>
      </AnimatedSlideIn>
    </QuestionScreen>
  );
}
