import { View } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { useI18n } from '../../lib/i18n';
import { formatCurrency } from '../../lib/finance';
import { computeGoalGap } from '../../lib/insights';
import {
  buildSavingsProjection,
  getSavingsInflowBreakdown,
  getTotalSavingsBalance,
} from '../../lib/savingsProjection';
import { hasTargetSavingsGoal } from '../../lib/incomeGoals';
import { C, T, tabularNums } from '../../constants/onboarding-theme';
import SurfaceCard from '../ui/SurfaceCard';
import DashboardSectionHeader from './DashboardSectionHeader';
import SavingsProjectionChart from './SavingsProjectionChart';
import { normalizeResetDestination } from '../../lib/monthEndRouting';

const INFLOW_KEYS = {
  budgetShift: 'dashboard.savingsScreen.inflow.budgetShift',
  goalReserve: 'dashboard.savingsScreen.inflow.goalReserve',
  ongoingGoal: 'dashboard.savingsScreen.inflow.ongoingGoal',
  resetPolicy: 'dashboard.savingsScreen.inflow.resetPolicy',
  resetLoose: 'dashboard.savingsScreen.inflow.resetLoose',
};

function getLooseMoneyBalance(budget) {
  return Number(budget?.looseMoneyBalance) || 0;
}

function getOtherGoalBalance(budget) {
  return Number(budget?.otherGoalBalance) || 0;
}

export default function SavingsContent({ bundle, currency }) {
  const { t } = useI18n();
  const goalGap = computeGoalGap(bundle.financials);
  const projection = buildSavingsProjection({
    financials: bundle.financials,
    goalGap,
  });
  const balance = getTotalSavingsBalance(bundle.financials, goalGap);
  const inflows = getSavingsInflowBreakdown(bundle.financials, goalGap);
  const inc = bundle.financials.income || {};
  const budget = bundle.financials.budget || {};

  return (
    <View style={{ gap: 16 }}>
      <SurfaceCard>
        <Text style={{ ...T.fieldLabel }}>{t('dashboard.savingsScreen.totalBalance')}</Text>
        <Text style={{ fontSize: 32, fontWeight: '700', color: C.primary, marginTop: 4, ...tabularNums }}>
          {formatCurrency(balance, currency)}
        </Text>
        <Text style={{ ...T.helper, color: C.muted, marginTop: 8 }}>
          {t('dashboard.savingsScreen.balanceHelper')}
        </Text>
      </SurfaceCard>

      <SurfaceCard>
        <Text style={{ ...T.fieldLabel }}>{t('dashboard.savingsScreen.monthlyPlan')}</Text>
        <Text style={{ fontSize: 22, fontWeight: '700', color: C.primary, marginTop: 4, ...tabularNums }}>
          {formatCurrency(projection.monthlyInflow, currency)}
        </Text>
        <Text style={{ ...T.caption, color: C.muted, marginTop: 4 }}>
          {t('dashboard.savingsScreen.monthlyPlanHelper')}
        </Text>
        {inflows.length > 0 ? (
          <View style={{ marginTop: 12, gap: 8 }}>
            {inflows.map((row) => (
              <View
                key={row.key}
                style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <Text style={{ ...T.helper, flex: 1, paddingRight: 8 }}>
                  {t(INFLOW_KEYS[row.key] || row.key)}
                </Text>
                {row.amount > 0 ? (
                  <Text style={{ ...T.helper, fontWeight: '600', ...tabularNums }}>
                    {formatCurrency(row.amount, currency)}
                  </Text>
                ) : (
                  <Text style={{ ...T.caption, color: C.muted }}>{t('dashboard.savingsScreen.variable')}</Text>
                )}
              </View>
            ))}
          </View>
        ) : (
          <Text style={{ ...T.helper, color: C.muted, marginTop: 12 }}>
            {t('dashboard.savingsScreen.noInflows')}
          </Text>
        )}
      </SurfaceCard>

      {getLooseMoneyBalance(budget) > 0 ? (
        <SurfaceCard>
          <Text style={{ ...T.fieldLabel }}>{t('dashboard.savingsScreen.looseMoney')}</Text>
          <Text style={{ fontSize: 28, fontWeight: '700', color: C.primary, marginTop: 4, ...tabularNums }}>
            {formatCurrency(getLooseMoneyBalance(budget), currency)}
          </Text>
          <Text style={{ ...T.helper, color: C.muted, marginTop: 8 }}>
            {t('dashboard.savingsScreen.looseMoneyHelper')}
          </Text>
        </SurfaceCard>
      ) : null}

      {getOtherGoalBalance(budget) > 0 ? (
        <SurfaceCard>
          <Text style={{ ...T.fieldLabel }}>
            {budget.resetOtherGoalNote || t('dashboard.savingsScreen.otherGoalFallback')}
          </Text>
          <Text style={{ fontSize: 28, fontWeight: '700', color: C.primary, marginTop: 4, ...tabularNums }}>
            {formatCurrency(getOtherGoalBalance(budget), currency)}
          </Text>
          <Text style={{ ...T.helper, color: C.muted, marginTop: 8 }}>
            {t('dashboard.savingsScreen.otherGoalHelper')}
          </Text>
        </SurfaceCard>
      ) : null}

      {budget.rolloverStrategy === 'reset' && budget.resetUnspentDestination ? (
        <SurfaceCard>
          <Text style={{ ...T.fieldLabel }}>{t('dashboard.savingsScreen.resetPolicy')}</Text>
          <Text style={{ ...T.helper, marginTop: 6 }}>
            {normalizeResetDestination(budget.resetUnspentDestination) === 'savings'
              ? t('dashboard.savingsScreen.resetToSavings')
              : normalizeResetDestination(budget.resetUnspentDestination) === 'otherGoal'
                ? t('dashboard.savingsScreen.resetToOther', {
                  name: budget.resetOtherGoalNote || t('dashboard.savingsScreen.otherGoalFallback'),
                })
                : t('dashboard.savingsScreen.resetLooseMoney')}
          </Text>
        </SurfaceCard>
      ) : null}


      <DashboardSectionHeader title={t('dashboard.savingsScreen.projectionTitle')} />
      <SurfaceCard>
        <Text style={{ ...T.caption, color: C.muted, marginBottom: 16 }}>
          {hasTargetSavingsGoal(inc) && inc.goalDate
            ? t('dashboard.savingsScreen.projectionGoalHelper', {
              target: formatCurrency(inc.goalAmount, currency),
              date: inc.goalDate,
            })
            : t('dashboard.savingsScreen.projectionHelper')}
        </Text>
        <SavingsProjectionChart projection={projection} currency={currency} />
      </SurfaceCard>
    </View>
  );
}
