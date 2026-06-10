import { useState } from 'react';
import { Stack, useSegments } from 'expo-router';
import { View, Text, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useI18n } from '../../lib/i18n';
import AppSidebar, { AppSidebarMobileTrigger } from '../../components/app/AppSidebar';
import { C, S } from '../../constants/onboarding-theme';

const WIDE_BREAKPOINT = 768;

const TAB_LABEL_MAP = {
  dashboard: 'dashboard.title',
  income: 'dashboard.income',
  costs: 'dashboard.expenses',
  budget: 'dashboard.budget',
  tracker: 'dashboard.tracker',
  goals: 'dashboard.goals',
  savings: 'dashboard.savings',
  summary: 'dashboard.summary',
  alerts: 'dashboard.alerts',
};

export default function AppLayout() {
  const { t } = useI18n();
  const segments = useSegments();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isWide = width >= WIDE_BREAKPOINT;
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const currentRoute = segments[segments.length - 1];
  const headerTitle = TAB_LABEL_MAP[currentRoute] ? t(TAB_LABEL_MAP[currentRoute]) : '';

  return (
    <View style={{ flex: 1, flexDirection: 'row', backgroundColor: C.bg }}>
      <AppSidebar
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />

      <View style={{ flex: 1 }}>
        {!isWide ? (
          <View style={{
            backgroundColor: C.surface,
            paddingHorizontal: S.pagePadH,
            paddingTop: insets.top,
            minHeight: S.navHeight + insets.top,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            borderBottomWidth: 1,
            borderBottomColor: C.border,
          }}>
            <AppSidebarMobileTrigger onMobileOpen={() => setMobileSidebarOpen(true)} />
            <Text style={{ fontSize: 17, fontWeight: '600', color: C.primary, flex: 1 }}>
              {headerTitle}
            </Text>
          </View>
        ) : null}

        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'fade',
            animationDuration: 220,
          }}
        />
      </View>
    </View>
  );
}
