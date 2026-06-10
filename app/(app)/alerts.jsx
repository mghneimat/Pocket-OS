import { useState, useCallback, useEffect } from 'react';
import { View, ScrollView, RefreshControl } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { useI18n } from '../../lib/i18n';
import { loadDashboardBundle } from '../../lib/dashboardData';
import { C, S, T } from '../../constants/onboarding-theme';
import PrimaryButton from '../../components/ui/PrimaryButton';
import AlertsContent from '../../components/dashboard/AlertsContent';

export default function AlertsScreen() {
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

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ ...T.helper }}>{t('dashboard.home.loading')}</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center', padding: S.pagePadH }}>
        <Text style={{ ...T.helper, color: C.danger, marginBottom: 16 }}>{error}</Text>
        <PrimaryButton onPress={load}>{t('common.retry')}</PrimaryButton>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: C.bg }}
      contentContainerStyle={{ padding: S.pagePadH, paddingVertical: S.pagePadV, maxWidth: 900, alignSelf: 'center', width: '100%' }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
    >
      <Text style={{ ...T.questionTitle, fontSize: 28, marginBottom: 20 }}>{t('dashboard.alerts')}</Text>
      <AlertsContent bundle={bundle} onRefresh={load} />
    </ScrollView>
  );
}
