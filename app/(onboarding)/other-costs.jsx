import { useState, useEffect, useRef } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useI18n } from '../../lib/i18n';
import { getData, setData } from '../../lib/storage';
import { getCurrencySymbol } from '../../lib/currency';
import { C, S, T, R } from '../../constants/onboarding-theme';
import QuestionScreen from '../../components/onboarding/QuestionScreen';
import PillToggle from '../../components/onboarding/PillToggle';
import DatePicker from '../../components/onboarding/DatePicker';
import AnimatedSlideIn from '../../components/onboarding/AnimatedSlideIn';
import LabeledInput from '../../components/onboarding/LabeledInput';
import FrequencyPills from '../../components/onboarding/FrequencyPills';
import InputGroup from '../../components/onboarding/InputGroup';
import CostCard from '../../components/onboarding/CostCard';
import { useSectionExit } from '../../lib/finishOnboardingSection';

const QUICK_ADD_CHIPS = [
  'groceries', 'mobilePhone', 'lifeInsurance', 'homeInsurance',
  'gym', 'hairSalon', 'laundry', 'charity',
  'education', 'pension', 'other',
];

const FREQUENCIES = ['monthly', 'quarterly', 'annual'];

export default function OtherCostsScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const { isEditMode, completeSection, leaveSection, editContinueLabel } = useSectionExit();

  const [validationError, setValidationError] = useState('');
  const [occupation, setOccupation] = useState(null);
  const [costs, setCosts] = useState([]);
  const [visibleCosts, setVisibleCosts] = useState({});
  const [removingCosts, setRemovingCosts] = useState(new Set());

  // ── Loaded data ──
  const [currencyCode, setCurrencyCode] = useState('CZK');
  const currency = getCurrencySymbol(currencyCode);

  useEffect(() => {
    (async () => {
      const o = await getData('pocketos_occupation');
      setOccupation(o);
      const loc = await getData('pocketos_location');
      if (loc?.currency) setCurrencyCode(loc.currency);
    })();
  }, []);

  const addCost = (name) => {
    const newIdx = costs.length;
    setCosts([...costs, {
      name,
      amount: '',
      frequency: 'monthly',
      dueDate: '',
    }]);
    // Start hidden, then animate in on next tick
    setVisibleCosts(prev => ({ ...prev, [newIdx]: false }));
    setTimeout(() => {
      setVisibleCosts(prev => ({ ...prev, [newIdx]: true }));
    }, 50);
  };

  const updateCost = (idx, updates) => {
    const updated = [...costs];
    updated[idx] = { ...updated[idx], ...updates };
    setCosts(updated);
  };

  const removeCost = (idx) => {
    const name = costs[idx]?.name;
    if (name) {
      // Keep chip visually active during card animation
      setRemovingCosts(prev => new Set(prev).add(name));
    }
    // Animate out first, then remove after animation
    setVisibleCosts(prev => ({ ...prev, [idx]: false }));
    setTimeout(() => {
      setCosts(prev => prev.filter((_, i) => i !== idx));
      setRemovingCosts(prev => {
        const next = new Set(prev);
        next.delete(name);
        return next;
      });
    }, 300);
  };

  const hasCost = (name) => costs.some(c => c.name === name) || removingCosts.has(name);

  const toggleCost = (name) => {
    if (hasCost(name)) {
      const idx = costs.findIndex(c => c.name === name);
      if (idx !== -1) removeCost(idx);
    } else {
      addCost(name);
    }
  };

  const handleContinue = async () => {
    setValidationError('');

    for (let i = 0; i < costs.length; i++) {
      if (!costs[i].amount) {
        setValidationError(t('onboarding.otherCosts.q12.validation'));
        return;
      }
    }

    await completeSection({
      persist: async () => { await setData('pocketos_other_costs', costs); },
      onboardingPatch: { completed: false, currentStep: 'other-costs', percentComplete: 88 },
      nextRoute: '/(onboarding)/splash-debts',
    });
  };

  const progress = 88;
  const screenProgress = isEditMode ? undefined : progress;

  return (
    <QuestionScreen
      chapter={t('onboarding.otherCosts.chapter')}
      title={t('onboarding.otherCosts.q12.title')}
      helper={t('onboarding.otherCosts.q12.helper')}
      onContinue={handleContinue}
      onBack={() => leaveSection(() => router.replace('/(onboarding)/splash-other-costs'))}
      validationError={validationError}
      progress={screenProgress}
      continueLabel={editContinueLabel}
    >
      {/* Quick-add chips — toggle style */}
      <Text style={{ ...T.fieldLabel, color: C.muted, marginBottom: 10 }}>
        {t('onboarding.otherCosts.q12.quickAdd')}
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20, width: '100%' }}>
        {QUICK_ADD_CHIPS.map(name => {
          const isActive = hasCost(name);
          return (
            <Pressable
              key={name}
              onPress={() => toggleCost(name)}
              style={({ pressed }) => ({
                paddingVertical: 10,
                paddingHorizontal: 14,
                borderRadius: R.chip,
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
              <Text style={{
                fontSize: 13,
                fontWeight: isActive ? '600' : '500',
                color: isActive ? C.primary : C.muted,
                marginRight: isActive ? 6 : 0,
              }}>
                {t(`onboarding.otherCosts.q12.costs.${name}`)}
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

      {/* OSVČ auto-prompt */}
      {occupation?.user === 'selfEmployed' && (
        <View style={{ padding: 14, backgroundColor: 'rgba(79,70,229,0.06)', borderRadius: 10, borderWidth: 1, borderColor: 'rgba(79,70,229,0.15)', marginBottom: 16 }}>
          <Text style={{ fontSize: 14, color: C.primary, fontWeight: '600', marginBottom: 4 }}>
            {t('onboarding.otherCosts.q12.osvcNote')}
          </Text>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
            <Pressable
              onPress={() => addCost('osvcSocial')}
              style={{ paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, backgroundColor: C.primary, alignItems: 'center' }}
            >
              <Text style={{ fontSize: 13, color: '#FFFFFF', fontWeight: '500' }}>
                {t('onboarding.otherCosts.q12.costs.osvcSocial')}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => addCost('osvcHealth')}
              style={{ paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, backgroundColor: C.primary, alignItems: 'center' }}
            >
              <Text style={{ fontSize: 13, color: '#FFFFFF', fontWeight: '500' }}>
                {t('onboarding.otherCosts.q12.costs.osvcHealth')}
              </Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* Cost cards */}
      {costs.map((cost, idx) => (
        <AnimatedSlideIn key={idx} visible={visibleCosts[idx] !== false}>
          <CostCard
            title={t(`onboarding.otherCosts.q12.costs.${cost.name}`)}
            onRemove={() => removeCost(idx)}
          >
            <InputGroup nested>
              <LabeledInput
                label={t('onboarding.otherCosts.q12.amountLabel')}
                value={cost.amount}
                onChangeText={(v) => updateCost(idx, { amount: v })}
                numeric
                placeholder={t('onboarding.otherCosts.q12.amountPlaceholder')}
                large
                inGroup
                currency={currency}
              />
              <FrequencyPills
                options={FREQUENCIES}
                value={cost.frequency}
                onChange={(freq) => updateCost(idx, { frequency: freq })}
                small
              />
            </InputGroup>

            {/* Due date */}
            <Text style={{ ...T.fieldLabel, color: C.muted, marginBottom: S.labelGap }}>
              {t('onboarding.otherCosts.q12.dueDateLabel')}
            </Text>
            <DatePicker
              value={cost.dueDate}
              onChange={(v) => updateCost(idx, { dueDate: v })}
            />
          </CostCard>
        </AnimatedSlideIn>
      ))}
    </QuestionScreen>
  );
}
