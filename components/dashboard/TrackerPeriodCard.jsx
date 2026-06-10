import { View } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { useI18n } from '../../lib/i18n';
import { formatCurrency } from '../../lib/finance';
import { C, T, tabularNums } from '../../constants/onboarding-theme';
import SurfaceCard from '../ui/SurfaceCard';

const STATUS_COLORS = {
  under: C.positive,
  on_track: C.primary,
  over: C.danger,
};

function destinationLabel(t, monthlyPreview, currency) {
  const { route, strategy, resetDestination, otherGoalNote } = monthlyPreview;
  if (strategy === 'free') {
    return t('dashboard.trackerScreen.monthly.route.rolloverFree');
  }
  if (strategy === 'capped') {
    if (route.excessToLoose) {
      return t('dashboard.trackerScreen.monthly.route.rolloverCappedSplit', {
        rollover: formatCurrency(route.amount, currency),
        loose: formatCurrency(route.excessToLoose, currency),
      });
    }
    return t('dashboard.trackerScreen.monthly.route.rolloverCapped');
  }
  if (resetDestination === 'savings') {
    return t('dashboard.trackerScreen.monthly.route.savings');
  }
  if (resetDestination === 'otherGoal') {
    return t('dashboard.trackerScreen.monthly.route.otherGoal', {
      name: otherGoalNote || t('dashboard.savingsScreen.otherGoalFallback'),
    });
  }
  return t('dashboard.trackerScreen.monthly.route.looseMoney');
}

function MetricRow({ label, value, currency, emphasize }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
      <Text style={{ ...T.helper, flex: 1, paddingRight: 8 }}>{label}</Text>
      <Text
        style={{
          ...T.helper,
          fontWeight: emphasize ? '700' : '600',
          fontSize: emphasize ? 18 : 14,
          ...tabularNums,
        }}
      >
        {value}
      </Text>
    </View>
  );
}

/**
 * @param {'daily'|'weekly'|'monthly'} period
 */
export default function TrackerPeriodCard({ period, previews, currency }) {
  const { t } = useI18n();
  const prefix = `dashboard.trackerScreen.${period}`;

  if (period === 'monthly') {
    const preview = previews.monthly;
    const routeLabel = destinationLabel(t, preview, currency);

    return (
      <SurfaceCard>
        <Text style={{ ...T.fieldLabel }}>{t(`${prefix}.title`)}</Text>
        <Text style={{ ...T.caption, color: C.muted, marginTop: 4 }}>
          {t(`${prefix}.helper`)}
        </Text>

        <View style={{ marginTop: 16, gap: 10 }}>
          <MetricRow
            label={t(`${prefix}.spentSoFar`)}
            value={formatCurrency(preview.spentSoFar, currency)}
            currency={currency}
          />
          <MetricRow
            label={t(`${prefix}.projectedLeftover`)}
            value={formatCurrency(preview.projectedLeftover, currency)}
            currency={currency}
            emphasize
          />
        </View>

        {preview.projectedLeftover > 0 ? (
          <View
            style={{
              marginTop: 16,
              padding: 12,
              borderRadius: 8,
              backgroundColor: C.chipSelectedBg,
            }}
          >
            <Text style={{ ...T.caption, color: C.muted }}>{t(`${prefix}.goesTo`)}</Text>
            <Text style={{ ...T.helper, fontWeight: '600', color: C.primary, marginTop: 4 }}>
              {routeLabel}
            </Text>
          </View>
        ) : (
          <Text style={{ ...T.helper, color: C.muted, marginTop: 16 }}>
            {t(`${prefix}.noLeftover`)}
          </Text>
        )}
      </SurfaceCard>
    );
  }

  const data = previews[period];
  const statusColor = STATUS_COLORS[data.status] || C.primary;

  return (
    <SurfaceCard>
      <Text style={{ ...T.fieldLabel }}>{t(`${prefix}.title`)}</Text>
      <Text style={{ ...T.caption, color: C.muted, marginTop: 4 }}>
        {t(`${prefix}.helper`)}
      </Text>

      <View style={{ marginTop: 16, gap: 10 }}>
        <MetricRow
          label={t(`${prefix}.allowance`)}
          value={formatCurrency(data.allowance, currency)}
          currency={currency}
        />
        <MetricRow
          label={t(`${prefix}.spent`)}
          value={formatCurrency(data.spent, currency)}
          currency={currency}
        />
        {data.over > 0 ? (
          <MetricRow
            label={t(`${prefix}.over`)}
            value={formatCurrency(data.over, currency)}
            currency={currency}
            emphasize
          />
        ) : (
          <MetricRow
            label={t(`${prefix}.remaining`)}
            value={formatCurrency(data.remaining, currency)}
            currency={currency}
            emphasize
          />
        )}
      </View>

      <View
        style={{
          marginTop: 16,
          padding: 12,
          borderRadius: 8,
          backgroundColor: C.chipSelectedBg,
        }}
      >
        <Text style={{ ...T.helper, fontWeight: '600', color: statusColor }}>
          {t(`${prefix}.status.${data.status}`)}
        </Text>
      </View>

      {!data.hasLogs ? (
        <Text style={{ ...T.caption, color: C.muted, marginTop: 12 }}>
          {t('dashboard.trackerScreen.noSpendLogged')}
        </Text>
      ) : null}
    </SurfaceCard>
  );
}
