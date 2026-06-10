import { useState, useEffect, useCallback } from 'react';
import { View, ScrollView, RefreshControl } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { useI18n } from '../../lib/i18n';
import { loadDashboardBundle } from '../../lib/dashboardData';
import { subscribeDashboardRefresh } from '../../lib/dashboardRefresh';
import { C, S, T } from '../../constants/onboarding-theme';
import PrimaryButton from '../ui/PrimaryButton';
import EditSectionButton from '../app/EditSectionButton';
import ScreenTransitionShell from '../app/ScreenTransitionShell';
import SaveFeedbackBanner from './SaveFeedbackBanner';

const MAX_WIDTH = 900;

export default function DashboardPageShell({ titleKey, sectionId, showSectionEdit = true, roleHintKey, children }) {
  const { t } = useI18n();
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

  if (loading) {
    return (
      <ScreenTransitionShell variant="tab">
        <View style={{ flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center', padding: S.pagePadH }}>
          <Text style={{ ...T.helper }}>{t('dashboard.home.loading')}</Text>
        </View>
      </ScreenTransitionShell>
    );
  }

  if (error) {
    return (
      <ScreenTransitionShell variant="tab">
        <View style={{ flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center', padding: S.pagePadH }}>
          <Text style={{ ...T.helper, textAlign: 'center', marginBottom: 24, color: C.danger }}>{error}</Text>
          <PrimaryButton onPress={load}>{t('common.retry')}</PrimaryButton>
        </View>
      </ScreenTransitionShell>
    );
  }

  return (
    <ScreenTransitionShell variant="tab">
    <ScrollView
      style={{ flex: 1, backgroundColor: C.bg }}
      contentContainerStyle={{
        paddingHorizontal: S.pagePadH,
        paddingVertical: S.pagePadV,
        maxWidth: MAX_WIDTH,
        width: '100%',
        alignSelf: 'center',
      }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={C.primary} />
      }
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: roleHintKey ? 8 : 20 }}>
        <Text
          accessibilityRole="header"
          style={{ ...T.questionTitle, fontSize: 28, lineHeight: 34, flex: 1 }}
        >
          {t(titleKey)}
        </Text>
        {sectionId && showSectionEdit ? (
          <EditSectionButton sectionId={sectionId} variant="header" />
        ) : null}
      </View>
      {roleHintKey ? (
        <Text style={{ ...T.helper, marginBottom: 16 }}>{t(roleHintKey)}</Text>
      ) : null}
      <SaveFeedbackBanner />
      {children(bundle)}
    </ScrollView>
    </ScreenTransitionShell>
  );
}
