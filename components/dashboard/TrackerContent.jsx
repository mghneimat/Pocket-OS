import { View } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { useI18n } from '../../lib/i18n';
import { buildTrackerPreviews } from '../../lib/trackerPreview';
import { C, T } from '../../constants/onboarding-theme';
import SurfaceCard from '../ui/SurfaceCard';
import DashboardSectionHeader from './DashboardSectionHeader';
import TrackerPeriodCard from './TrackerPeriodCard';
import MonthEndHistoryList from './MonthEndHistoryList';

export default function TrackerContent({ bundle, currency }) {
  const { t } = useI18n();
  const budget = bundle.financials.budget || {};
  const previews = buildTrackerPreviews({
    budget,
    effectiveMonthlyFlexible: bundle.financials.effectiveMonthlyFlexible
      ?? bundle.financials.monthlyFlexible,
    dailyLogs: bundle.financials.dailyLogs || [],
  });

  return (
    <View style={{ gap: 16 }}>
      <DashboardSectionHeader title={t('dashboard.trackerScreen.intro.title')} />
      <SurfaceCard>
        <Text style={{ ...T.helper, color: C.muted }}>
          {t('dashboard.trackerScreen.intro.body')}
        </Text>
        <Text style={{ ...T.caption, color: C.muted, marginTop: 12 }}>
          {t('dashboard.trackerScreen.intro.loggingSoon')}
        </Text>
      </SurfaceCard>

      <TrackerPeriodCard period="daily" previews={previews} currency={currency} />
      <TrackerPeriodCard period="weekly" previews={previews} currency={currency} />
      <TrackerPeriodCard period="monthly" previews={previews} currency={currency} />

      <MonthEndHistoryList budget={budget} currency={currency} />
    </View>
  );
}
