import { View } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import Svg, { Polyline, Circle, Line } from 'react-native-svg';
import { useI18n } from '../../lib/i18n';
import { formatCurrency } from '../../lib/finance';
import { C, T, tabularNums } from '../../constants/onboarding-theme';

const CHART_H = 160;
const PAD = 16;

/**
 * Simple line chart for anticipated savings balance.
 */
export default function SavingsProjectionChart({ projection, currency }) {
  const { t } = useI18n();
  const points = projection?.points || [];
  if (points.length < 2) {
    return (
      <Text style={{ ...T.helper, color: C.muted }}>
        {t('dashboard.savingsScreen.chart.empty')}
      </Text>
    );
  }

  const width = 320;
  const innerW = width - PAD * 2;
  const innerH = CHART_H - PAD * 2;
  const balances = points.map((p) => p.balance);
  const min = Math.min(...balances, 0);
  const max = Math.max(...balances, min + 1);
  const range = max - min;

  const coords = points.map((p, i) => {
    const x = PAD + (i / (points.length - 1)) * innerW;
    const y = PAD + innerH - ((p.balance - min) / range) * innerH;
    return { x, y, balance: p.balance, monthIndex: p.monthIndex };
  });

  const polyline = coords.map((c) => `${c.x},${c.y}`).join(' ');
  const last = coords[coords.length - 1];
  const goalAmount = projection.goalAmount;

  return (
    <View>
      <Svg width="100%" height={CHART_H} viewBox={`0 0 ${width} ${CHART_H}`}>
        <Line
          x1={PAD}
          y1={PAD + innerH}
          x2={width - PAD}
          y2={PAD + innerH}
          stroke={C.border}
          strokeWidth={1}
        />
        {goalAmount && goalAmount >= min && goalAmount <= max ? (
          <Line
            x1={PAD}
            y1={PAD + innerH - ((goalAmount - min) / range) * innerH}
            x2={width - PAD}
            y2={PAD + innerH - ((goalAmount - min) / range) * innerH}
            stroke={C.positive}
            strokeWidth={1}
            strokeDasharray="4 4"
            opacity={0.6}
          />
        ) : null}
        <Polyline
          points={polyline}
          fill="none"
          stroke={C.primary}
          strokeWidth={2.5}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <Circle cx={last.x} cy={last.y} r={4} fill={C.primary} />
      </Svg>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
        <Text style={{ ...T.caption, color: C.muted }}>{t('dashboard.savingsScreen.chart.now')}</Text>
        <Text style={{ ...T.caption, color: C.muted }}>
          {projection.monthsToGoal
            ? t('dashboard.savingsScreen.chart.goalMonth', { months: projection.monthsToGoal })
            : t('dashboard.savingsScreen.chart.monthsAhead', { months: points.length - 1 })}
        </Text>
      </View>
      <Text style={{ ...T.caption, color: C.muted, marginTop: 4, ...tabularNums }}>
        {t('dashboard.savingsScreen.chart.projected', {
          amount: formatCurrency(last.balance, currency),
        })}
      </Text>
    </View>
  );
}
