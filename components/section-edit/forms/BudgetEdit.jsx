import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { useI18n } from '../../../lib/i18n';
import { effectiveSpendingBudget, formatCurrency } from '../../../lib/finance';
import { splitFlexibleBudget, clampBudgetSpendingRatio, resolveBudgetSpendingRatio } from '../../../lib/budgetSplit';
import BudgetSplitSlider from '../../onboarding/BudgetSplitSlider';
import { computeGoalGap } from '../../../lib/goalGap';
import { getMonthlySavingsReservation } from '../../../lib/incomeGoals';
import { loadHouseholdFinancials } from '../../../lib/householdBudget';
import { SECTION_STORAGE_KEYS, parseAmount, amountToString } from '../../../lib/sectionEditStorage';
import { C, T } from '../../../constants/onboarding-theme';
import SectionEditForm from '../SectionEditForm';
import FrequencyPills from '../../onboarding/FrequencyPills';
import YesNoToggle from '../../onboarding/YesNoToggle';
import OptionCard from '../../onboarding/OptionCard';
import LabeledInput from '../../onboarding/LabeledInput';
import InputGroup from '../../onboarding/InputGroup';
import AnimatedSlideIn from '../../onboarding/AnimatedSlideIn';
import { normalizeResetDestination } from '../../../lib/monthEndRouting';

function toEditState(saved) {
  const s = saved || {};
  return {
    monthlyFlexible: amountToString(s.monthlyFlexible ?? ''),
    budgetDisplayFrequency: s.budgetDisplayFrequency || 'daily',
    rolloverStrategy: s.rolloverStrategy || 'free',
    rolloverMultiplier: s.rolloverMultiplier || 2,
    rolloverCapType: s.rolloverCapType || 'multiplier',
    rolloverCapAmount: amountToString(s.rolloverCapAmount ?? ''),
    resetUnspentDestination: normalizeResetDestination(s.resetUnspentDestination),
    resetOtherGoalNote: s.resetOtherGoalNote || '',
    rolloverBalance: s.rolloverBalance ?? 0,
    looseMoneyBalance: s.looseMoneyBalance ?? 0,
    otherGoalBalance: s.otherGoalBalance ?? 0,
    lastClosedPeriod: s.lastClosedPeriod || null,
    monthEndHistory: s.monthEndHistory || [],
    deductSavingsGoal: s.deductSavingsGoal === true,
    budgetSpendingRatio: s?.budgetSpendingRatio != null
      ? clampBudgetSpendingRatio(s.budgetSpendingRatio)
      : undefined,
    _legacyMonthlyFlexible: s?.monthlyFlexible,
  };
}

function toPayload(draft, availableBudget) {
  const strategy = draft.rolloverStrategy || 'free';
  const ratio = resolveBudgetSpendingRatio(
    {
      budgetSpendingRatio: draft.budgetSpendingRatio,
      monthlyFlexible: draft._legacyMonthlyFlexible,
    },
    availableBudget ?? 0,
  );
  const { spendingMonthly, savingsShift } = splitFlexibleBudget(availableBudget ?? 0, ratio);
  return {
    monthlyFlexible: spendingMonthly,
    budgetSpendingRatio: ratio,
    budgetSavingsShift: savingsShift,
    budgetDisplayFrequency: draft.budgetDisplayFrequency,
    rolloverStrategy: strategy,
    rolloverMultiplier: strategy === 'capped' && draft.rolloverCapType === 'multiplier'
      ? draft.rolloverMultiplier
      : null,
    rolloverCapType: strategy === 'capped' ? draft.rolloverCapType : null,
    rolloverCapAmount: strategy === 'capped' && draft.rolloverCapType === 'amount'
      ? Math.round(parseAmount(draft.rolloverCapAmount) || 0)
      : null,
    resetUnspentDestination: strategy === 'reset' ? draft.resetUnspentDestination : null,
    resetOtherGoalNote: strategy === 'reset' && draft.resetUnspentDestination === 'otherGoal'
      ? (draft.resetOtherGoalNote?.trim() || null)
      : null,
    rolloverBalance: draft.rolloverBalance ?? 0,
    looseMoneyBalance: draft.looseMoneyBalance ?? 0,
    otherGoalBalance: draft.otherGoalBalance ?? 0,
    lastClosedPeriod: draft.lastClosedPeriod || null,
    monthEndHistory: draft.monthEndHistory || [],
    deductSavingsGoal: draft.deductSavingsGoal === true,
  };
}

export default function BudgetEdit() {
  const { t } = useI18n();
  const [calculated, setCalculated] = useState(null);
  const [hasGoal, setHasGoal] = useState(false);
  const [goalMonthly, setGoalMonthly] = useState(0);

  useEffect(() => {
    (async () => {
      const financials = await loadHouseholdFinancials(t);
      setCalculated(financials.availableBudget);
      const gap = computeGoalGap(financials);
      const monthly = getMonthlySavingsReservation(financials.income, gap);
      setHasGoal(monthly > 0);
      setGoalMonthly(monthly);
    })();
  }, [t]);

  return (
    <SectionEditForm
      storageKey={SECTION_STORAGE_KEYS.budget}
      initialData={toEditState(null)}
      loadTransform={(saved) => toEditState(saved)}
      transformBeforeSave={(draft) => toPayload(draft, calculated)}
      validate={(draft, tr) => {
        if (calculated == null) return tr('sectionEdit.budget.validation.amount');
        return null;
      }}
    >
      {({ data, setData, currency }) => {
        if (!data) return null;
        const update = (patch) => setData((prev) => ({ ...prev, ...patch }));
        const activeRatio = resolveBudgetSpendingRatio(
          {
            budgetSpendingRatio: data.budgetSpendingRatio,
            monthlyFlexible: data._legacyMonthlyFlexible,
          },
          calculated ?? 0,
        );
        const { spendingMonthly, savingsShift } = splitFlexibleBudget(calculated ?? 0, activeRatio);
        const effective = effectiveSpendingBudget(spendingMonthly, goalMonthly, data.deductSavingsGoal);

        return (
          <View>
            <Text style={{ ...T.helper, color: C.muted, marginBottom: 16 }}>
              {t('sectionEdit.budget.helper')}
            </Text>

            {calculated != null ? (
              <Text style={{ ...T.caption, color: C.muted, marginBottom: 12 }}>
                {t('sectionEdit.budget.calculated', { amount: formatCurrency(calculated, currency) })}
              </Text>
            ) : null}

            <FrequencyPills
              label={t('sectionEdit.budget.displayFrequency')}
              options={['daily', 'weekly', 'monthly']}
              value={data.budgetDisplayFrequency}
              onChange={(v) => update({ budgetDisplayFrequency: v })}
              containerStyle={{ marginBottom: 16 }}
            />

            {calculated != null && calculated > 0 ? (
              <View style={{ marginBottom: 20 }}>
                <Text style={{ ...T.fieldLabel, marginBottom: 6 }}>
                  {t('onboarding.budget.q14.splitSlider.label')}
                </Text>
                <Text style={{ ...T.caption, color: C.muted, marginBottom: 12 }}>
                  {t('onboarding.budget.q14.splitSlider.helper')}
                </Text>
                <BudgetSplitSlider
                  value={activeRatio}
                  onChange={(r) => update({ budgetSpendingRatio: r })}
                  totalAvailable={calculated}
                />
                {savingsShift > 0 ? (
                  <Text style={{ ...T.caption, color: C.muted, marginTop: 10 }}>
                    {t('onboarding.budget.q14.splitSlider.summary', {
                      spend: formatCurrency(effective, currency),
                      savings: formatCurrency(savingsShift, currency),
                    })}
                  </Text>
                ) : null}
              </View>
            ) : null}

            {hasGoal ? (
              <View style={{ marginBottom: 20 }}>
                <Text style={{ ...T.fieldLabel, marginBottom: 8 }}>
                  {t('sectionEdit.budget.deductSavingsGoal')}
                </Text>
                <YesNoToggle
                  value={data.deductSavingsGoal}
                  onChange={(v) => update({ deductSavingsGoal: v })}
                  yesLabel={t('onboarding.budget.q14.deductSavingsGoal.yes')}
                  noLabel={t('onboarding.budget.q14.deductSavingsGoal.no')}
                />
                {data.deductSavingsGoal ? (
                  <Text style={{ ...T.caption, color: C.muted }}>
                    {t('sectionEdit.budget.effectiveSpend', { amount: formatCurrency(effective, currency) })}
                  </Text>
                ) : null}
              </View>
            ) : null}

            <Text style={{ ...T.fieldLabel, marginBottom: 12 }}>{t('sectionEdit.budget.rollover')}</Text>
            <OptionCard
              icon="♾️"
              label={t('onboarding.budget.q14a.free')}
              subtitle={t('onboarding.budget.q14a.freeDesc')}
              selected={data.rolloverStrategy === 'free'}
              onPress={() => update({ rolloverStrategy: 'free' })}
            />
            <OptionCard
              icon="🎯"
              label={t('onboarding.budget.q14a.capped')}
              subtitle={t('onboarding.budget.q14a.cappedDesc')}
              selected={data.rolloverStrategy === 'capped'}
              onPress={() => update({ rolloverStrategy: 'capped' })}
            />
            <OptionCard
              icon="🔁"
              label={t('onboarding.budget.q14a.reset')}
              subtitle={t('onboarding.budget.q14a.resetDesc')}
              selected={data.rolloverStrategy === 'reset'}
              onPress={() => update({ rolloverStrategy: 'reset' })}
            />
            <AnimatedSlideIn visible={data.rolloverStrategy === 'capped'}>
              <OptionCard
                label={t('onboarding.budget.q14a.capTypeMultiplier')}
                selected={data.rolloverCapType === 'multiplier'}
                onPress={() => update({ rolloverCapType: 'multiplier' })}
              />
              <OptionCard
                label={t('onboarding.budget.q14a.capTypeAmount')}
                selected={data.rolloverCapType === 'amount'}
                onPress={() => update({ rolloverCapType: 'amount' })}
              />
              {data.rolloverCapType === 'multiplier' ? (
                <FrequencyPills
                  label={t('onboarding.budget.q14a.multiplierLabel')}
                  options={[2, 3, 4]}
                  value={data.rolloverMultiplier}
                  onChange={(v) => update({ rolloverMultiplier: v })}
                  labelMap={{
                    2: t('onboarding.budget.q14a.multiplier2'),
                    3: t('onboarding.budget.q14a.multiplier3'),
                    4: t('onboarding.budget.q14a.multiplier4'),
                  }}
                />
              ) : (
                <InputGroup label={t('onboarding.budget.q14a.customCapLabel')}>
                  <LabeledInput
                    value={data.rolloverCapAmount}
                    onChangeText={(v) => update({ rolloverCapAmount: v })}
                    numeric
                    inGroup
                    currency={currency}
                  />
                </InputGroup>
              )}
            </AnimatedSlideIn>
            <AnimatedSlideIn visible={data.rolloverStrategy === 'reset'}>
              {['looseMoney', 'savings', 'otherGoal'].map((key) => (
                <OptionCard
                  key={key}
                  label={t(`onboarding.budget.q14a.reset${key === 'looseMoney' ? 'LooseMoney' : key === 'savings' ? 'ToSavings' : 'ToOtherGoal'}`)}
                  subtitle={t(`onboarding.budget.q14a.reset${key === 'looseMoney' ? 'LooseMoney' : key === 'savings' ? 'ToSavings' : 'ToOtherGoal'}Helper`)}
                  selected={data.resetUnspentDestination === key}
                  onPress={() => update({ resetUnspentDestination: key })}
                />
              ))}
              {data.resetUnspentDestination === 'otherGoal' ? (
                <LabeledInput
                  label={t('onboarding.budget.q14a.otherGoalLabel')}
                  value={data.resetOtherGoalNote}
                  onChangeText={(v) => update({ resetOtherGoalNote: v })}
                />
              ) : null}
            </AnimatedSlideIn>
          </View>
        );
      }}
    </SectionEditForm>
  );
}
