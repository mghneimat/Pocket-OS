import { useMemo, useState, useEffect } from 'react';
import { View } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { useI18n } from '../../lib/i18n';
import { getCurrencySymbol } from '../../lib/currency';
import { getHeadlineInsight } from '../../lib/insights';
import { useDashboardFrequency } from '../../lib/useDashboardFrequency';
import { committedMonthlyLoad } from '../../lib/finance';
import {
  OVERVIEW_TAB_KEY,
  buildFixedExpensePanels,
  buildRecurringExpensePanels,
  buildOverviewPanels,
} from '../../lib/expensePanels';
import TabHeroMetric from './TabHeroMetric';
import SectionAIInsightCard from './SectionAIInsightCard';
import ExpenseUnderlineTabBar from './ExpenseUnderlineTabBar';
import ExpensesCategoryPanel from './ExpensesCategoryPanel';
import DashboardTabPanel from './DashboardTabPanel';
import DashboardFrequencyToggle from './DashboardFrequencyToggle';
import { formatDashboardAmount } from './formatDashboardAmount';
import { T, C } from '../../constants/onboarding-theme';

const PERIOD_LABEL_KEYS = {
  daily: 'dashboard.home.kpi.perDay',
  weekly: 'dashboard.home.kpi.perWeek',
  monthly: 'dashboard.home.kpi.perMonth',
};

export default function ExpensesContent({ bundle }) {
  const { t } = useI18n();
  const currency = getCurrencySymbol(bundle.financials.currencyCode);
  const { financials, insights } = bundle;
  const sections = financials.sections || {};
  const household = sections.household || null;
  const { frequency, setFrequency } = useDashboardFrequency('monthly');

  const committedMonthly = committedMonthlyLoad(financials);
  const annualCommitted = committedMonthly * 12;
  const headlineInsight = getHeadlineInsight(insights, t);
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();

  const fixedPanels = useMemo(
    () => buildFixedExpensePanels(sections, household, t),
    [sections, household, t],
  );

  const recurringPanels = useMemo(
    () => buildRecurringExpensePanels(sections, financials.debts, household, t),
    [sections, financials.debts, household, t],
  );

  const overviewPanels = useMemo(
    () => buildOverviewPanels(fixedPanels, recurringPanels),
    [fixedPanels, recurringPanels],
  );

  const primaryTabs = useMemo(() => [
    { key: OVERVIEW_TAB_KEY, label: t('dashboard.expensesScreen.tabs.overview') },
    { key: 'fixed', label: t('dashboard.expensesScreen.tabs.fixed') },
    { key: 'recurring', label: t('dashboard.expensesScreen.tabs.recurring') },
  ], [t]);

  const [primaryTab, setPrimaryTab] = useState(OVERVIEW_TAB_KEY);
  const [secondaryTab, setSecondaryTab] = useState(fixedPanels[0]?.key || '');

  const isOverview = primaryTab === OVERVIEW_TAB_KEY;
  const activePanels = primaryTab === 'fixed' ? fixedPanels : recurringPanels;

  const secondaryTabs = useMemo(
    () => activePanels.map((p) => ({ key: p.key, label: p.label })),
    [activePanels],
  );

  useEffect(() => {
    if (isOverview) return;
    const keys = activePanels.map((p) => p.key);
    if (!keys.length) {
      setSecondaryTab('');
      return;
    }
    if (!keys.includes(secondaryTab)) {
      setSecondaryTab(keys[0]);
    }
  }, [primaryTab, activePanels, secondaryTab, isOverview]);

  const activePanel = activePanels.find((p) => p.key === secondaryTab) || null;

  const heroValue = formatDashboardAmount(committedMonthly, frequency, currency, daysInMonth);
  const periodLabel = t(PERIOD_LABEL_KEYS[frequency] || PERIOD_LABEL_KEYS.monthly);
  const tabHelperKey = isOverview
    ? 'dashboard.expensesScreen.tabs.helper.overview'
    : primaryTab === 'fixed'
      ? 'dashboard.expensesScreen.tabs.helper.fixed'
      : 'dashboard.expensesScreen.tabs.helper.recurring';
  const fixedLabel = formatDashboardAmount(financials.fixedCosts, 'monthly', currency, daysInMonth);
  const debtLabel = formatDashboardAmount(financials.debtPayments, 'monthly', currency, daysInMonth);

  return (
    <View>
      <TabHeroMetric
        tone="expense"
        label={t('dashboard.expensesScreen.committedCosts')}
        value={heroValue}
        periodLabel={periodLabel}
        secondaryLabel={t('dashboard.expensesScreen.committedBreakdown', {
          fixed: fixedLabel,
          debt: debtLabel,
        })}
        tertiaryLabel={t('dashboard.expensesScreen.committedAnnual', {
          amount: formatDashboardAmount(annualCommitted, 'monthly', currency, daysInMonth),
        })}
      >
        <DashboardFrequencyToggle
          value={frequency}
          onChange={setFrequency}
          style={{ marginTop: 10, marginBottom: 0 }}
        />
      </TabHeroMetric>

      <SectionAIInsightCard insight={headlineInsight} />

      <ExpenseUnderlineTabBar
        tabs={primaryTabs}
        activeKey={primaryTab}
        onChange={(key) => {
          setPrimaryTab(key);
          if (key === 'fixed') setSecondaryTab(fixedPanels[0]?.key || '');
          if (key === 'recurring') setSecondaryTab(recurringPanels[0]?.key || '');
        }}
        accessibilityLabel={t('dashboard.expensesScreen.tabs.primaryA11y')}
      />

      <Text style={{ ...T.helper, color: C.muted, marginTop: 8, marginBottom: 4 }}>
        {t(tabHelperKey)}
      </Text>

      {!isOverview ? (
        <View style={{ marginTop: 4 }}>
          <ExpenseUnderlineTabBar
            tabs={secondaryTabs}
            activeKey={secondaryTab}
            onChange={setSecondaryTab}
            accessibilityLabel={t('dashboard.expensesScreen.tabs.secondaryA11y')}
          />
        </View>
      ) : null}

      <DashboardTabPanel
        panelKey={isOverview ? OVERVIEW_TAB_KEY : `${primaryTab}-${secondaryTab}`}
        style={{ marginTop: 12 }}
      >
        {isOverview ? (
          <ExpensesCategoryPanel
            variant="overview"
            panels={overviewPanels}
            displayTotal={committedMonthly}
            currency={currency}
            currencyCode={financials.currencyCode}
            t={t}
            frequency={frequency}
            setFrequency={setFrequency}
            daysInMonth={daysInMonth}
          />
        ) : activePanel ? (
          <ExpensesCategoryPanel
            variant="detail"
            categoryLabel={activePanel.label}
            categoryKey={activePanel.key}
            lineItems={activePanel.lineItems}
            sectionId={activePanel.sectionId}
            currency={currency}
            currencyCode={financials.currencyCode}
            t={t}
          />
        ) : null}
      </DashboardTabPanel>
    </View>
  );
}
