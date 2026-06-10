import { View, Pressable } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { useI18n } from '../../lib/i18n';
import { formatCurrency } from '../../lib/finance';
import { buildLedgerCascade } from '../../lib/ledgerCascade';
import { navigateFromDashboard } from '../../lib/screenTransition';
import { C, R, T, tabularNums } from '../../constants/onboarding-theme';

function CascadeRow({
  label,
  value,
  onPress,
  accessibilityHint,
  emphasis = false,
  deficit = false,
  warning = false,
  subLabel,
  indent = false,
  dividerBefore = false,
}) {
  const valueColor = deficit ? C.danger : emphasis ? C.primary : C.primary;

  return (
    <>
      {dividerBefore ? (
        <View
          style={{ height: 1, backgroundColor: C.divider, marginVertical: 10 }}
          accessibilityRole="none"
        />
      ) : null}
      <Pressable
        onPress={onPress}
        disabled={!onPress}
        accessibilityRole={onPress ? 'button' : 'text'}
        accessibilityLabel={`${label}, ${value}`}
        accessibilityHint={accessibilityHint}
        style={({ pressed, hovered }) => ({
          flexDirection: 'row',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 12,
          paddingVertical: 10,
          paddingHorizontal: indent ? 8 : 4,
          borderRadius: R.input,
          backgroundColor: pressed && onPress ? C.bg : hovered && onPress ? C.bg : 'transparent',
          opacity: pressed && onPress ? 0.85 : 1,
        })}
      >
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text
            style={{
              ...T.caption,
              color: warning ? C.accent : C.muted,
              fontSize: emphasis ? 13 : 12,
              fontWeight: emphasis ? '600' : '400',
            }}
            numberOfLines={2}
          >
            {label}
          </Text>
          {subLabel ? (
            <Text style={{ ...T.caption, color: C.muted, marginTop: 4, fontSize: 11 }} numberOfLines={3}>
              {subLabel}
            </Text>
          ) : null}
        </View>
        <Text
          style={{
            fontSize: emphasis ? 16 : 15,
            fontWeight: emphasis ? '700' : '600',
            color: valueColor,
            ...tabularNums,
            flexShrink: 0,
          }}
          numberOfLines={1}
        >
          {value}
        </Text>
      </Pressable>
    </>
  );
}

export default function HouseholdLedgerStrip({ financials, currency, insights }) {
  const { t } = useI18n();
  const router = useRouter();
  const cascade = useMemo(
    () => buildLedgerCascade(financials, insights || {}),
    [financials, insights],
  );

  const go = (route) => navigateFromDashboard(router, route);

  return (
    <View style={{ marginBottom: 20 }}>
      <View
        accessibilityRole="summary"
        accessibilityLabel={t('dashboard.ledgerCascade.a11y')}
        style={{
          borderRadius: R.card,
          borderWidth: 1,
          borderColor: C.border,
          backgroundColor: C.surface,
          paddingHorizontal: 12,
          paddingVertical: 8,
        }}
      >
        <CascadeRow
          label={t('dashboard.ledgerCascade.income')}
          value={formatCurrency(cascade.income, currency)}
          onPress={() => go('income')}
          accessibilityHint={t('dashboard.ledgerCascade.openIncome')}
        />

        <CascadeRow
          label={t('dashboard.ledgerCascade.committed')}
          value={formatCurrency(cascade.committed, currency)}
          onPress={() => go('costs')}
          accessibilityHint={t('dashboard.ledgerCascade.openExpenses')}
          subLabel={t('dashboard.ledgerCascade.committedHint')}
          indent
        />

        <CascadeRow
          label={t('dashboard.ledgerCascade.available')}
          value={formatCurrency(cascade.available, currency)}
          onPress={() => go('budget')}
          accessibilityHint={t('dashboard.ledgerCascade.openBudget')}
          emphasis
          deficit={cascade.isOvercommitted}
          dividerBefore
        />

        {cascade.showCostReduction ? (
          <CascadeRow
            label={t('dashboard.ledgerCascade.costsReduced')}
            value={formatCurrency(cascade.costReduction, currency)}
            onPress={() => go('goals')}
            accessibilityHint={t('dashboard.ledgerCascade.openGoals')}
            subLabel={
              cascade.costReduction > 0
                ? t('dashboard.ledgerCascade.costsReducedSince')
                : t('dashboard.ledgerCascade.costsReducedNone')
            }
            indent
          />
        ) : null}

        {cascade.showSaved ? (
          <CascadeRow
            label={t('dashboard.ledgerCascade.saved')}
            value={formatCurrency(cascade.saved, currency)}
            onPress={() => go('goals')}
            accessibilityHint={t('dashboard.ledgerCascade.openGoals')}
            warning={cascade.savedIsInformational}
            subLabel={
              cascade.savedIsInformational
                ? t('dashboard.ledgerCascade.savedIncluded')
                : t('dashboard.ledgerCascade.savedDeducted')
            }
            indent
          />
        ) : null}

        <CascadeRow
          label={t('dashboard.ledgerCascade.toSpend')}
          value={formatCurrency(cascade.toSpend, currency)}
          onPress={() => go('budget')}
          accessibilityHint={t('dashboard.ledgerCascade.openBudget')}
          subLabel={
            cascade.savedIsInformational
              ? t('dashboard.ledgerCascade.toSpendIncludedGoal')
              : undefined
          }
          indent
        />

        {cascade.showUnallocated ? (
          <CascadeRow
            label={t('dashboard.ledgerCascade.unallocated')}
            value={formatCurrency(cascade.unallocated, currency)}
            onPress={() => go('budget')}
            accessibilityHint={t('dashboard.ledgerCascade.openBudget')}
            emphasis
            dividerBefore
          />
        ) : null}
      </View>
    </View>
  );
}
