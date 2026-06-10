import { useMemo, useState, useEffect } from 'react';
import { View } from 'react-native';
import { useI18n } from '../../lib/i18n';
import { getCurrencySymbol } from '../../lib/currency';
import { getSectionInsight } from '../../lib/insights';
import { useDashboardFrequency } from '../../lib/useDashboardFrequency';
import {
  INCOME_OVERVIEW_KEY,
  INCOME_PRIMARY_KEY,
  INCOME_OTHER_KEY,
  buildOverviewIncomePanels,
  buildPrimaryIncomePanels,
  buildOtherIncomePanels,
} from '../../lib/incomePanels';
import TabHeroMetric from './TabHeroMetric';
import SectionAIInsightCard from './SectionAIInsightCard';
import ExpenseUnderlineTabBar from './ExpenseUnderlineTabBar';
import IncomeCategoryPanel from './IncomeCategoryPanel';
import DashboardTabPanel from './DashboardTabPanel';
import DashboardFrequencyToggle from './DashboardFrequencyToggle';
import { formatDashboardAmount } from './formatDashboardAmount';

const PERIOD_LABEL_KEYS = {
  daily: 'dashboard.home.kpi.perDay',
  weekly: 'dashboard.home.kpi.perWeek',
  monthly: 'dashboard.home.kpi.perMonth',
};

export default function IncomeContent({ bundle }) {
  const { t } = useI18n();
  const currency = getCurrencySymbol(bundle.financials.currencyCode);
  const inc = bundle.financials.income || {};
  const household = bundle.financials.sections?.household || null;
  const { frequency, setFrequency } = useDashboardFrequency('monthly');

  const monthlyTotal = bundle.financials.totalIncome;
  const annualTotal = monthlyTotal * 12;
  const insight = getSectionInsight('income', bundle.insights, t);
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();

  const overviewPanels = useMemo(
    () => buildOverviewIncomePanels(inc, household, t),
    [inc, household, t],
  );

  const primaryPanels = useMemo(
    () => buildPrimaryIncomePanels(inc, household, t),
    [inc, household, t],
  );

  const otherPanels = useMemo(
    () => buildOtherIncomePanels(inc, t),
    [inc, t],
  );

  const primaryTabs = useMemo(() => [
    { key: INCOME_OVERVIEW_KEY, label: t('dashboard.incomeScreen.tabs.overview') },
    { key: INCOME_PRIMARY_KEY, label: t('dashboard.incomeScreen.tabs.primary') },
    { key: INCOME_OTHER_KEY, label: t('dashboard.incomeScreen.tabs.other') },
  ], [t]);

  const [primaryTab, setPrimaryTab] = useState(INCOME_OVERVIEW_KEY);
  const [secondaryTab, setSecondaryTab] = useState(primaryPanels[0]?.key || '');

  const isOverview = primaryTab === INCOME_OVERVIEW_KEY;
  const activePanels = primaryTab === INCOME_PRIMARY_KEY ? primaryPanels : otherPanels;

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

  const heroValue = formatDashboardAmount(monthlyTotal, frequency, currency, daysInMonth);
  const periodLabel = t(PERIOD_LABEL_KEYS[frequency] || PERIOD_LABEL_KEYS.monthly);

  return (
    <View>
      <TabHeroMetric
        tone="income"
        label={t('dashboard.incomeScreen.total')}
        value={heroValue}
        periodLabel={periodLabel}
        secondaryLabel={t('dashboard.incomeScreen.annualTotal', {
          amount: formatDashboardAmount(annualTotal, 'monthly', currency, daysInMonth),
        })}
      >
        <DashboardFrequencyToggle
          value={frequency}
          onChange={setFrequency}
          style={{ marginTop: 10, marginBottom: 0 }}
        />
      </TabHeroMetric>

      <SectionAIInsightCard insight={insight} />

      <ExpenseUnderlineTabBar
        tabs={primaryTabs}
        activeKey={primaryTab}
        onChange={(key) => {
          setPrimaryTab(key);
          if (key === INCOME_PRIMARY_KEY) setSecondaryTab(primaryPanels[0]?.key || '');
          if (key === INCOME_OTHER_KEY) setSecondaryTab(otherPanels[0]?.key || '');
        }}
        accessibilityLabel={t('dashboard.incomeScreen.tabs.primaryA11y')}
      />

      {!isOverview && secondaryTabs.length > 0 ? (
        <View style={{ marginTop: 4 }}>
          <ExpenseUnderlineTabBar
            tabs={secondaryTabs}
            activeKey={secondaryTab}
            onChange={setSecondaryTab}
            accessibilityLabel={t('dashboard.incomeScreen.tabs.secondaryA11y')}
          />
        </View>
      ) : null}

      <DashboardTabPanel
        panelKey={isOverview ? INCOME_OVERVIEW_KEY : `${primaryTab}-${secondaryTab}`}
        style={{ marginTop: 12 }}
      >
        {isOverview ? (
          <IncomeCategoryPanel
            variant="overview"
            panels={overviewPanels}
            currency={currency}
            currencyCode={bundle.financials.currencyCode}
            t={t}
            frequency={frequency}
            setFrequency={setFrequency}
            daysInMonth={daysInMonth}
          />
        ) : activePanel ? (
          <IncomeCategoryPanel
            variant="detail"
            categoryLabel={activePanel.label}
            lineItems={activePanel.lineItems}
            currency={currency}
            currencyCode={bundle.financials.currencyCode}
            t={t}
            emptyLabel={t('dashboard.incomeScreen.subtabEmpty', { type: activePanel.label })}
          />
        ) : (
          <IncomeCategoryPanel
            variant="detail"
            categoryLabel={primaryTab === INCOME_OTHER_KEY
              ? t('dashboard.incomeScreen.tabs.other')
              : t('dashboard.incomeScreen.tabs.primary')}
            lineItems={[]}
            currency={currency}
            currencyCode={bundle.financials.currencyCode}
            t={t}
            emptyLabel={t('dashboard.incomeScreen.otherEmpty')}
            emptyHint={t('dashboard.incomeScreen.otherEmptyHint')}
            emptyActionLabel={t('dashboard.incomeScreen.addOtherSource')}
            showEmptyAdd={primaryTab === INCOME_OTHER_KEY}
          />
        )}
      </DashboardTabPanel>
    </View>
  );
}
