import { View, Pressable } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { useRouter } from 'expo-router';
import { useI18n } from '../../lib/i18n';
import { getCurrencySymbol } from '../../lib/currency';
import { formatCurrency } from '../../lib/finance';
import { EDIT_SECTION_ROUTES } from '../../lib/householdBudget';
import {
  GOAL_TYPES,
  hasFinancialGoal,
  hasOngoingSavingsGoal,
  hasTargetSavingsGoal,
  normalizeIncomeGoalFields,
} from '../../lib/incomeGoals';
import { C, R, T, tabularNums } from '../../constants/onboarding-theme';
import SurfaceCard from '../ui/SurfaceCard';

export default function GoalsContent({ bundle }) {
  const { t } = useI18n();
  const router = useRouter();
  const currency = getCurrencySymbol(bundle.financials.currencyCode);
  const inc = bundle.financials.income;
  const goalGap = bundle.insights.goalGap;
  const { goalType } = normalizeIncomeGoalFields(inc);

  if (!hasFinancialGoal(inc)) {
    return (
      <SurfaceCard>
        <Text style={{ ...T.body, color: C.muted, marginBottom: 16 }}>
          {t('dashboard.goalsScreen.empty')}
        </Text>
        <Pressable
          onPress={() => router.push(EDIT_SECTION_ROUTES.income)}
          accessibilityRole="button"
          style={({ pressed }) => ({
            paddingVertical: 12,
            paddingHorizontal: 16,
            borderRadius: R.button,
            backgroundColor: pressed ? C.accentPressed : C.accent,
            alignSelf: 'flex-start',
            minHeight: 44,
            justifyContent: 'center',
          })}
        >
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#FFFFFF' }}>
            {t('dashboard.goalsScreen.setGoal')}
          </Text>
        </Pressable>
      </SurfaceCard>
    );
  }

  if (goalType === GOAL_TYPES.REDUCE_COSTS) {
    return (
      <SurfaceCard>
        <Text style={{ ...T.fieldLabel, marginBottom: 4 }}>{t('dashboard.goalsScreen.goalType')}</Text>
        <Text style={{ fontSize: 22, fontWeight: '700', color: C.primary }}>
          {t('dashboard.goalsScreen.reduceCosts')}
        </Text>
        <Text style={{ ...T.helper, marginTop: 8 }}>
          {t('dashboard.goalsScreen.reduceCostsHelper')}
        </Text>
      </SurfaceCard>
    );
  }

  if (hasOngoingSavingsGoal(inc)) {
    return (
      <View style={{ gap: 16 }}>
        <SurfaceCard>
          <Text style={{ ...T.fieldLabel, marginBottom: 4 }}>{t('dashboard.goalsScreen.ongoingTarget')}</Text>
          <Text style={{ fontSize: 28, fontWeight: '700', color: C.primary, ...tabularNums }}>
            {formatCurrency(inc.savingsMonthlyTarget, currency)}
          </Text>
          <Text style={{ ...T.helper, marginTop: 8 }}>
            {t('dashboard.goalsScreen.ongoingHelper')}
          </Text>
        </SurfaceCard>
        {inc.savingsBalance ? (
          <SurfaceCard>
            <Text style={{ ...T.fieldLabel }}>{t('dashboard.goalsScreen.currentSavings')}</Text>
            <Text style={{ fontSize: 22, fontWeight: '700', color: C.primary, marginTop: 4, ...tabularNums }}>
              {formatCurrency(inc.savingsBalance, currency)}
            </Text>
          </SurfaceCard>
        ) : null}
      </View>
    );
  }

  if (!hasTargetSavingsGoal(inc)) {
    return (
      <SurfaceCard>
        <Text style={{ ...T.body, color: C.muted }}>{t('dashboard.goalsScreen.empty')}</Text>
      </SurfaceCard>
    );
  }

  return (
    <View style={{ gap: 16 }}>
      <SurfaceCard>
        <Text style={{ ...T.fieldLabel, marginBottom: 4 }}>{t('dashboard.goalsScreen.target')}</Text>
        <Text style={{ fontSize: 28, fontWeight: '700', color: C.primary, ...tabularNums }}>
          {formatCurrency(inc.goalAmount, currency)}
        </Text>
        {inc.goalDescription ? (
          <Text style={{ ...T.helper, marginTop: 8 }}>{inc.goalDescription}</Text>
        ) : null}
        {inc.goalDate ? (
          <Text style={{ ...T.caption, color: C.muted, marginTop: 8 }}>
            {t('dashboard.goalsScreen.byDate', { date: inc.goalDate })}
          </Text>
        ) : null}
      </SurfaceCard>

      {inc.savingsBalance ? (
        <SurfaceCard>
          <Text style={{ ...T.fieldLabel }}>{t('dashboard.goalsScreen.currentSavings')}</Text>
          <Text style={{ fontSize: 22, fontWeight: '700', color: C.primary, marginTop: 4, ...tabularNums }}>
            {formatCurrency(inc.savingsBalance, currency)}
          </Text>
        </SurfaceCard>
      ) : null}

      {goalGap ? (
        <SurfaceCard>
          <Text style={{ ...T.fieldLabel }}>{t('dashboard.goalsScreen.monthlyNeeded')}</Text>
          <Text style={{
            fontSize: 22,
            fontWeight: '700',
            color: goalGap.achievable ? C.positive : C.danger,
            marginTop: 4,
            ...tabularNums,
          }}>
            {formatCurrency(goalGap.monthlyRequired, currency)}
          </Text>
          <Text style={{ ...T.helper, marginTop: 8 }}>
            {goalGap.achievable
              ? t('dashboard.goalsScreen.onTrack', { amount: formatCurrency(bundle.financials.monthlyFlexible, currency) })
              : t('dashboard.goalsScreen.gap', {
                needed: formatCurrency(goalGap.monthlyRequired, currency),
                available: formatCurrency(bundle.financials.monthlyFlexible, currency),
              })}
          </Text>
        </SurfaceCard>
      ) : null}
    </View>
  );
}
