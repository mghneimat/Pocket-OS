import { View, Pressable } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { useI18n } from '../../lib/i18n';
import { formatCurrency } from '../../lib/finance';
import { buildTrackerPreviews } from '../../lib/trackerPreview';
import { buildMonthEndPreview } from '../../lib/monthEndRouting';
import {
  formatMonthEndDestination,
  formatMonthEndHistoryDestination,
} from '../../lib/monthEndLabels';
import { C, T, tabularNums } from '../../constants/onboarding-theme';
import SurfaceCard from '../ui/SurfaceCard';
import DashboardSectionHeader from './DashboardSectionHeader';

const STATUS_COLORS = {
  under: C.positive,
  on_track: C.primary,
  over: C.danger,
};

function PaceColumn({ label, spent, allowance, currency, overLabel, remainingLabel }) {
  const over = spent > allowance;
  return (
    <View style={{ flex: 1, minWidth: 0 }}>
      <Text style={{ ...T.caption, color: C.muted, marginBottom: 6 }}>{label}</Text>
      <Text style={{ fontSize: 16, fontWeight: '700', color: C.primary, ...tabularNums }} numberOfLines={1}>
        {formatCurrency(spent, currency)}
        <Text style={{ fontSize: 13, fontWeight: '500', color: C.muted }}>
          {' / '}{formatCurrency(allowance, currency)}
        </Text>
      </Text>
      <Text style={{ ...T.caption, color: over ? C.danger : C.muted, marginTop: 4 }} numberOfLines={1}>
        {over
          ? `${overLabel}: ${formatCurrency(spent - allowance, currency)}`
          : `${remainingLabel}: ${formatCurrency(Math.max(0, allowance - spent), currency)}`}
      </Text>
    </View>
  );
}

export default function TrackerSnapshotCard({ financials, currency, onOpenTracker }) {
  const { t } = useI18n();

  const previews = buildTrackerPreviews({
    budget: financials.budget,
    effectiveMonthlyFlexible: financials.effectiveMonthlyFlexible ?? financials.monthlyFlexible,
    dailyLogs: financials.dailyLogs || [],
  });

  const statusColor = STATUS_COLORS[previews.daily.status] || C.primary;

  return (
    <View style={{ marginBottom: 16 }}>
      <DashboardSectionHeader
        title={t('dashboard.home.trackerSnapshot.title')}
        trailing={(
          <Pressable
            onPress={onOpenTracker}
            accessibilityRole="button"
            accessibilityLabel={t('dashboard.home.trackerSnapshot.openTracker')}
            style={({ pressed, hovered }) => ({
              opacity: pressed ? 0.7 : 1,
              minHeight: 36,
              justifyContent: 'center',
              paddingHorizontal: 4,
              backgroundColor: hovered ? C.overlayHover : 'transparent',
              borderRadius: 6,
            })}
          >
            <Text style={{ fontSize: 13, fontWeight: '600', color: C.accent }}>
              {t('dashboard.home.trackerSnapshot.openTracker')}
            </Text>
          </Pressable>
        )}
      />
      <Pressable
        onPress={onOpenTracker}
        accessibilityRole="button"
        accessibilityLabel={t('dashboard.home.trackerSnapshot.a11y')}
        style={({ pressed }) => ({ opacity: pressed ? 0.92 : 1 })}
      >
        <SurfaceCard>
          <View style={{ flexDirection: 'row', gap: 16 }}>
            <PaceColumn
              label={t('dashboard.trackerScreen.daily.title')}
              spent={previews.daily.spent}
              allowance={previews.daily.allowance}
              currency={currency}
              overLabel={t('dashboard.trackerScreen.daily.over')}
              remainingLabel={t('dashboard.trackerScreen.daily.remaining')}
            />
            <View style={{ width: 1, backgroundColor: C.divider }} />
            <PaceColumn
              label={t('dashboard.trackerScreen.weekly.title')}
              spent={previews.weekly.spent}
              allowance={previews.weekly.allowance}
              currency={currency}
              overLabel={t('dashboard.trackerScreen.weekly.over')}
              remainingLabel={t('dashboard.trackerScreen.weekly.remaining')}
            />
          </View>
          <Text style={{ ...T.caption, color: statusColor, marginTop: 14, fontWeight: '600' }}>
            {t(`dashboard.trackerScreen.daily.status.${previews.daily.status}`)}
          </Text>
          {!previews.daily.hasLogs && !previews.weekly.hasLogs ? (
            <Text style={{ ...T.caption, color: C.muted, marginTop: 8 }}>
              {t('dashboard.home.trackerSnapshot.noLogs')}
            </Text>
          ) : null}
        </SurfaceCard>
      </Pressable>
    </View>
  );
}
