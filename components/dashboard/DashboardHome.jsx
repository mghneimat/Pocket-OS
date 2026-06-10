import { useState, useEffect, useCallback } from 'react';
import { View, ScrollView, RefreshControl } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { useRouter } from 'expo-router';
import { navigateFromDashboard } from '../../lib/screenTransition';
import { useI18n } from '../../lib/i18n';
import { getCurrencySymbol } from '../../lib/currency';
import { loadDashboardBundle } from '../../lib/dashboardData';
import { subscribeDashboardRefresh } from '../../lib/dashboardRefresh';
import { getHeadlineInsight } from '../../lib/insights';
import { getHeadlineAction } from '../../lib/insightActions';
import { buildDashboardActionQueue } from '../../lib/dashboardAlerts';
import { C, S, T } from '../../constants/onboarding-theme';
import PrimaryButton from '../ui/PrimaryButton';
import ActionQueuePreview from './ActionQueuePreview';
import AIInsightCard from './AIInsightCard';
import HouseholdLedgerStrip from './HouseholdLedgerStrip';
import TrackerSnapshotCard from './TrackerSnapshotCard';
import MonthEndStatusCard from './MonthEndStatusCard';
const DASHBOARD_MAX_WIDTH = 900;

export default function DashboardHome() {
  const { t } = useI18n();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bundle, setBundle] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setError('');
      const data = await loadDashboardBundle(t);
      setBundle(data);
    } catch {
      setError(t('dashboard.home.loadError'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => subscribeDashboardRefresh(load), [load]);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const goTo = (route) => navigateFromDashboard(router, route);

  if (loading) {
    return (
      <View
        accessibilityRole="progressbar"
        accessibilityLabel={t('dashboard.home.loading')}
        style={{ flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center', padding: S.pagePadH }}
      >
        <Text style={{ ...T.helper }}>{t('dashboard.home.loading')}</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center', padding: S.pagePadH }}>
        <Text style={{ ...T.helper, textAlign: 'center', marginBottom: 24, maxWidth: 320, color: C.danger }}>
          {error}
        </Text>
        <PrimaryButton onPress={load}>{t('common.retry')}</PrimaryButton>
      </View>
    );
  }

  if (!bundle) return null;

  const { financials, insights } = bundle;
  const data = financials;
  const currency = getCurrencySymbol(data.currencyCode);
  const previewAlerts = buildDashboardActionQueue(bundle.alerts, insights, data, 3);
  const headlineAction = getHeadlineAction(insights);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: C.bg }}
      contentContainerStyle={{
        paddingHorizontal: S.pagePadH,
        paddingVertical: S.pagePadV,
        maxWidth: DASHBOARD_MAX_WIDTH,
        width: '100%',
        alignSelf: 'center',
      }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />
      }
    >
      <Text
        accessibilityRole="header"
        style={{ ...T.questionTitle, fontSize: 28, lineHeight: 34, marginBottom: 8 }}
      >
        {t('dashboard.title')}
      </Text>

      <Text style={{ ...T.helper, marginBottom: 16 }}>
        {t('dashboard.tabRoles.dashboard')}
      </Text>

      <HouseholdLedgerStrip financials={data} currency={currency} insights={insights} />

      <TrackerSnapshotCard
        financials={data}
        currency={currency}
        onOpenTracker={() => goTo('tracker')}
      />

      <MonthEndStatusCard
        financials={data}
        currency={currency}
        onOpenBudget={() => goTo('budget')}
      />

      <ActionQueuePreview
        title={t('dashboard.home.actions.title')}
        alerts={previewAlerts}
        t={t}
        viewAllLabel={t('dashboard.home.actions.viewAll')}
        onViewAll={() => goTo('alerts')}
      />

      <AIInsightCard
        title={t('dashboard.insights.cardTitle')}
        insight={getHeadlineInsight(insights, t)}
        ctaLabel={t(headlineAction.ctaKey)}
        onPress={() => goTo(headlineAction.route)}
        accessibilityLabel={t(headlineAction.ctaKey)}
      />
    </ScrollView>
  );
}
