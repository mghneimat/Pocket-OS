import { View } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { useI18n } from '../../lib/i18n';
import { getCurrencySymbol } from '../../lib/currency';
import { getSectionInsight, getHeadlineInsight } from '../../lib/insights';
import { T } from '../../constants/onboarding-theme';
import DashboardSectionHeader from './DashboardSectionHeader';
import BudgetSummaryTable from './BudgetSummaryTable';
import OverviewMetricCards from './OverviewMetricCards';

export default function SummaryContent({ bundle }) {
  const { t } = useI18n();
  const currency = getCurrencySymbol(bundle.financials.currencyCode);
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();

  return (
    <View>
      <Text style={{ ...T.helper, marginBottom: 16 }}>
        {t('dashboard.summaryScreen.intro')}
      </Text>
      <Text style={{ fontSize: 15, lineHeight: 22, color: '#1E3A5F', marginBottom: 20 }}>
        {getHeadlineInsight(bundle.insights, t)}
      </Text>
      <DashboardSectionHeader title={t('dashboard.summaryScreen.healthSection')} />
      <OverviewMetricCards
        financials={bundle.financials}
        insights={bundle.insights}
        currency={currency}
        daysInMonth={daysInMonth}
        showHeroPanels={false}
        secondaryMetricIds={['fixedLoad', 'recurring']}
      />
      <BudgetSummaryTable
        financials={bundle.financials}
        insights={bundle.insights}
        currency={currency}
        t={t}
        getSectionInsight={getSectionInsight}
      />
    </View>
  );
}
