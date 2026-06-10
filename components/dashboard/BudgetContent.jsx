import { useCallback, useEffect, useMemo, useState } from 'react';

import { View } from 'react-native';

import { Text } from '@gluestack-ui/themed';

import { useI18n } from '../../lib/i18n';

import { getCurrencySymbol } from '../../lib/currency';

import { displayBudget, effectiveSpendingBudget, formatCurrency } from '../../lib/finance';

import { getData, setData } from '../../lib/storage';

import { notifyDashboardRefresh } from '../../lib/dashboardRefresh';

import { getSectionInsight } from '../../lib/insights';

import { buildLedgerCascade } from '../../lib/ledgerCascade';

import { splitFlexibleBudget } from '../../lib/budgetSplit';

import { C, T } from '../../constants/onboarding-theme';

import SurfaceCard from '../ui/SurfaceCard';

import YesNoToggle from '../onboarding/YesNoToggle';

import BudgetSplitSlider from '../onboarding/BudgetSplitSlider';

import { getMonthlySavingsReservation } from '../../lib/incomeGoals';

import TabHeroMetric from './TabHeroMetric';

import SectionAIInsightCard from './SectionAIInsightCard';

import AnimatedCollapse from './AnimatedCollapse';



const ROLLOVER_KEYS = {

  free: 'dashboard.budgetScreen.rollover.free',

  capped: 'dashboard.budgetScreen.rollover.capped',

  reset: 'dashboard.budgetScreen.rollover.reset',

};



export default function BudgetContent({ bundle }) {

  const { t } = useI18n();

  const currency = getCurrencySymbol(bundle.financials.currencyCode);

  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();

  const budget = bundle.financials.budget || {};

  const freq = bundle.financials.budgetDisplayFrequency || 'daily';

  const goalGap = bundle.insights?.goalGap;

  const hasSavingsGoal = getMonthlySavingsReservation(bundle.financials.income, goalGap) > 0;

  const deductSavingsGoal = bundle.financials.deductSavingsGoal === true;

  const savingsGoalDeduction = deductSavingsGoal
    ? getMonthlySavingsReservation(bundle.financials.income, goalGap)
    : 0;

  const [previewSplit, setPreviewSplit] = useState(null);

  useEffect(() => {
    setPreviewSplit(null);
  }, [
    bundle.financials.monthlyFlexible,
    bundle.financials.budgetSavingsShift,
    bundle.financials.budget?.budgetSpendingRatio,
  ]);

  const financials = useMemo(() => {
    if (!previewSplit) return bundle.financials;

    const monthlyFlexible = previewSplit.spendingMonthly;
    const effectiveMonthlyFlexible = effectiveSpendingBudget(
      monthlyFlexible,
      savingsGoalDeduction,
      deductSavingsGoal,
    );

    return {
      ...bundle.financials,
      monthlyFlexible,
      budgetSavingsShift: previewSplit.savingsShift,
      effectiveMonthlyFlexible,
      budget: {
        ...(bundle.financials.budget || {}),
        budgetSpendingRatio: previewSplit.ratio,
        monthlyFlexible,
        budgetSavingsShift: previewSplit.savingsShift,
      },
    };
  }, [bundle.financials, previewSplit, savingsGoalDeduction, deductSavingsGoal]);

  const spendingMonthly = financials.effectiveMonthlyFlexible ?? financials.monthlyFlexible;

  const displayAmount = displayBudget(spendingMonthly, freq, daysInMonth);

  const monthlyDisplay = formatCurrency(spendingMonthly, currency);

  const annualDisplay = formatCurrency(spendingMonthly * 12, currency);

  const freqLabel = t(`dashboard.budgetScreen.frequency.${freq}`);

  const insight = getSectionInsight('budget', bundle.insights, t);

  const cascade = useMemo(
    () => buildLedgerCascade(financials, bundle.insights || {}),
    [financials, bundle.insights],
  );

  const spendingRatio = financials.budget?.budgetSpendingRatio != null
    ? financials.budget.budgetSpendingRatio
    : (financials.availableBudget > 0
      ? financials.monthlyFlexible / financials.availableBudget
      : 1);

  const handleSpendingRatioChange = useCallback(async (ratio) => {
    const avail = Number(financials.availableBudget) || 0;
    const split = splitFlexibleBudget(avail, ratio);
    setPreviewSplit(split);

    const saved = (await getData('pocketos_budget')) || {};
    await setData('pocketos_budget', {
      ...saved,
      budgetSpendingRatio: split.ratio,
      monthlyFlexible: split.spendingMonthly,
      budgetSavingsShift: split.savingsShift,
    });
    notifyDashboardRefresh();
  }, [financials.availableBudget]);

  const handleDeductChange = useCallback(async (value) => {

    const saved = (await getData('pocketos_budget')) || {};

    await setData('pocketos_budget', { ...saved, deductSavingsGoal: value === true });

    notifyDashboardRefresh();

  }, []);



  const detailsPrimary = deductSavingsGoal && hasSavingsGoal
    ? t('dashboard.budgetScreen.spendingAfterDeduction', {
      amount: formatCurrency(spendingMonthly, currency),
      deduction: formatCurrency(savingsGoalDeduction, currency),
    })
    : t('dashboard.budgetScreen.monthlyEquivalent', {
      amount: formatCurrency(financials.monthlyFlexible, currency),
    });

  const showSavingsShift = (financials.budgetSavingsShift || 0) > 0;



  return (

    <View style={{ gap: 0 }}>

      <TabHeroMetric

        tone="flexibility"

        label={t('dashboard.budgetScreen.flexible')}

        value={formatCurrency(displayAmount, currency)}

        periodLabel={freqLabel}

        secondaryLabel={t('dashboard.budgetScreen.annualEquivalent', {

          amount: annualDisplay,

          monthly: monthlyDisplay,

        })}

      />



      <SectionAIInsightCard insight={insight} />



      <SurfaceCard style={{ marginBottom: 16 }}>

        <Text style={{ ...T.fieldLabel, marginBottom: 8 }}>{t('dashboard.budgetScreen.detailsTitle')}</Text>

        <Text style={{ ...T.helper }}>

          {t('dashboard.budgetScreen.available', {

            amount: formatCurrency(financials.availableBudget, currency),

          })}

        </Text>

        <Text style={{ ...T.helper, marginTop: 8 }}>

          {detailsPrimary}

        </Text>

        <AnimatedCollapse visible={showSavingsShift} fallbackHeight={44}>
          <Text style={{ ...T.helper, marginTop: 8 }}>
            {t('dashboard.budgetScreen.savingsShift', {
              amount: formatCurrency(financials.budgetSavingsShift, currency),
            })}
          </Text>
        </AnimatedCollapse>

      </SurfaceCard>



      {cascade.showUnallocatedSlider ? (
        <SurfaceCard style={{ marginBottom: 16 }}>
          <Text style={{ ...T.fieldLabel }}>{t('dashboard.budgetScreen.unallocatedSlider.title')}</Text>
          <Text style={{ ...T.helper, color: C.muted, marginTop: 4, marginBottom: 16 }}>
            {t('dashboard.budgetScreen.unallocatedSlider.helper', {
              amount: formatCurrency(financials.availableBudget, currency),
            })}
          </Text>
          <BudgetSplitSlider
            value={spendingRatio}
            onChange={handleSpendingRatioChange}
            totalAvailable={financials.availableBudget}
          />
        </SurfaceCard>
      ) : null}



      {hasSavingsGoal ? (

        <SurfaceCard style={{ marginBottom: 16 }}>

          <Text style={{ ...T.fieldLabel }}>{t('dashboard.budgetScreen.deductSavingsGoal.label')}</Text>

          <Text style={{ ...T.helper, color: C.muted, marginTop: 4, marginBottom: 12 }}>

            {t('dashboard.budgetScreen.deductSavingsGoal.helper')}

          </Text>

          <YesNoToggle

            value={deductSavingsGoal}

            onChange={handleDeductChange}

            yesLabel={t('dashboard.budgetScreen.deductSavingsGoal.yes')}

            noLabel={t('dashboard.budgetScreen.deductSavingsGoal.no')}

            containerStyle={{ marginBottom: 0 }}

          />

        </SurfaceCard>

      ) : null}



      {budget.rolloverStrategy ? (

        <SurfaceCard>

          <Text style={{ ...T.fieldLabel }}>{t('dashboard.budgetScreen.rollover.title')}</Text>

          <Text style={{ fontSize: 17, fontWeight: '600', color: C.primary, marginTop: 4 }}>

            {t(ROLLOVER_KEYS[budget.rolloverStrategy] || ROLLOVER_KEYS.free)}

          </Text>

          {budget.rolloverStrategy === 'capped' && budget.rolloverMultiplier ? (

            <Text style={{ ...T.helper, marginTop: 8 }}>

              {t('dashboard.budgetScreen.rollover.multiplier', { value: budget.rolloverMultiplier })}

            </Text>

          ) : null}

        </SurfaceCard>

      ) : null}

    </View>

  );

}
