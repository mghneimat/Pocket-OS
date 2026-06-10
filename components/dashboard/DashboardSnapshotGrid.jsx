import { useMemo } from 'react';
import { View } from 'react-native';
import { useI18n } from '../../lib/i18n';
import { formatCurrency, committedMonthlyLoad } from '../../lib/finance';
import { formatDateDisplay } from '../../lib/datePicker';
import { C } from '../../constants/onboarding-theme';
import {
  GOAL_TYPES,
  hasOngoingSavingsGoal,
  hasTargetSavingsGoal,
  normalizeIncomeGoalFields,
} from '../../lib/incomeGoals';
import { BudgetIcon, CostsIcon, GoalsIcon, IncomeIcon } from '../app/AppNavIcons';
import MetricExplainCard from './MetricExplainCard';
import { DASHBOARD_CARD_TONES } from './dashboardCardTones';

export default function DashboardSnapshotGrid({
  financials,
  insights,
  currency,
  stackHero,
  onNavigate,
  onOpenMetric,
  infoA11y,
}) {
  const { t } = useI18n();
  const inc = financials.income;
  const surplus = insights.surplusMonthly;

  const savingsGoal = useMemo(() => {
    const { goalType } = normalizeIncomeGoalFields(inc);

    if (goalType === GOAL_TYPES.REDUCE_COSTS) {
      return {
        value: t('dashboard.home.kpi.reduceCosts'),
        footerLabel: t('dashboard.home.kpi.reduceCostsSubtitle'),
      };
    }

    if (hasTargetSavingsGoal(inc)) {
      const deadline = formatDateDisplay(inc.goalDate, false, t);
      return {
        value: formatCurrency(inc.goalAmount, currency),
        footerLabel: t('dashboard.home.kpi.goalByDeadline', { date: deadline }),
      };
    }

    if (hasOngoingSavingsGoal(inc)) {
      return {
        value: formatCurrency(inc.savingsMonthlyTarget, currency),
        footerLabel: t('dashboard.home.kpi.goalMonthly'),
      };
    }

    return {
      value: t('dashboard.home.kpi.noGoal'),
      footerLabel: t('dashboard.home.hero.setGoalPrompt'),
    };
  }, [inc, currency, t]);

  const gridItemStyle = stackHero
    ? { width: '48%', flexGrow: 1, flexBasis: '45%' }
    : { flex: 1, minWidth: 140 };

  const cards = [
    {
      id: 'income',
      tone: 'income',
      label: t('dashboard.home.kpi.totalIncome'),
      value: formatCurrency(financials.totalIncome, currency),
      footerLabel: t('dashboard.home.kpi.perMonth'),
      Icon: IncomeIcon,
      iconColor: DASHBOARD_CARD_TONES.income.iconColor,
      route: 'income',
      metricId: 'totalIncome',
    },
    {
      id: 'expenses',
      tone: 'expense',
      label: t('dashboard.home.kpi.committedCosts'),
      value: formatCurrency(committedMonthlyLoad(financials), currency),
      footerLabel: t('dashboard.home.kpi.committedCostsHint'),
      Icon: CostsIcon,
      iconColor: DASHBOARD_CARD_TONES.expense.iconColor,
      route: 'costs',
      metricId: 'totalExpenses',
    },
    {
      id: 'savingsGoal',
      tone: 'goal',
      label: t('dashboard.home.kpi.savingGoal'),
      value: savingsGoal.value,
      footerLabel: savingsGoal.footerLabel,
      Icon: GoalsIcon,
      iconColor: DASHBOARD_CARD_TONES.goal.iconColor,
      route: 'goals',
      metricId: 'savingsGoalPlan',
    },
    {
      id: 'monthlyBuffer',
      tone: 'flexibility',
      label: t('dashboard.home.health.budgetFlexibility'),
      value: surplus < 0
        ? `−${formatCurrency(Math.abs(surplus), currency)}`
        : formatCurrency(surplus, currency),
      footerLabel: t('dashboard.home.health.budgetFlexibilityLabel'),
      statusLabel: insights.flags.negativeSurplus
        ? t('dashboard.home.health.status.deficit')
        : null,
      statusColor: insights.flags.negativeSurplus ? C.danger : undefined,
      Icon: BudgetIcon,
      iconColor: DASHBOARD_CARD_TONES.flexibility.iconColor,
      route: 'budget',
      metricId: 'monthlyBuffer',
    },
  ];

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 12 }}>
      {cards.map((card) => {
        const { Icon } = card;
        return (
          <View key={card.id} style={gridItemStyle}>
            <MetricExplainCard
              variant="snapshot"
              tone={card.tone}
              label={card.label}
              labelIcon={<Icon color={card.iconColor} size={16} />}
              value={card.value}
              footerLabel={card.footerLabel}
              statusLabel={card.statusLabel}
              statusColor={card.statusColor}
              onPress={() => onNavigate(card.route)}
              onInfoPress={() => onOpenMetric(card.metricId)}
              infoAccessibilityLabel={infoA11y}
            />
          </View>
        );
      })}
    </View>
  );
}
