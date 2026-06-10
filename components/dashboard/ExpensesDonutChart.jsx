import { View } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import Svg, { Path, Circle, G } from 'react-native-svg';
import { C, T, tabularNums } from '../../constants/onboarding-theme';
import { formatSharePct } from '../../lib/formatSharePct';
import { donutSegmentPath } from '../../lib/donutSegment';
import { useBreakdownTableColumns, useIsDashboardNarrow } from '../../lib/dashboardLayout';
import { formatDashboardAmount } from './formatDashboardAmount';

const CHART_COLORS = [C.primary, C.accent, C.positive, '#6B4FA0', '#F59E0B', '#0EA5E9'];

const NAME_COL_W = 140;
const LEGEND_COL_GAP = 12;
const CARD_PADDING = 20;
const LEGEND_MAX_W = 420;

function LegendColumn({ children, align = 'left', width, flex }) {
  return (
    <View style={{
      ...(width != null ? { width, flexShrink: 0 } : { flex: flex ?? 1, minWidth: 0 }),
      alignItems: align === 'center' ? 'center' : 'flex-start',
      justifyContent: 'center',
    }}>
      {children}
    </View>
  );
}

function LegendHeader({ nameLabel, amountLabel, shareLabel, stacked, amountColW, shareColW }) {
  return (
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      gap: LEGEND_COL_GAP,
      marginBottom: 10,
      paddingBottom: 8,
      borderBottomWidth: 1,
      borderBottomColor: C.divider,
      width: '100%',
    }}>
      <View style={{ width: 10, flexShrink: 0 }} />
      <LegendColumn width={stacked ? undefined : NAME_COL_W} flex={stacked ? 1 : undefined} align="left">
        <Text style={{ ...T.caption, fontWeight: '600', color: C.muted }} numberOfLines={1}>
          {nameLabel}
        </Text>
      </LegendColumn>
      <LegendColumn width={amountColW} align="center">
        <Text style={{ ...T.caption, fontWeight: '600', color: C.muted, textAlign: 'center' }} numberOfLines={1}>
          {amountLabel}
        </Text>
      </LegendColumn>
      <LegendColumn width={shareColW} align="center">
        <Text style={{ ...T.caption, fontWeight: '600', color: C.muted, textAlign: 'center' }} numberOfLines={1}>
          {shareLabel}
        </Text>
      </LegendColumn>
    </View>
  );
}

function LegendRows({
  segments, total, frequency, currency, daysInMonth, stacked, amountColW, shareColW,
}) {
  return (
    <View style={{ gap: 8, width: '100%' }}>
      {segments.map((seg, i) => (
        <View key={seg.key} style={{ flexDirection: 'row', alignItems: 'center', gap: LEGEND_COL_GAP, width: '100%' }}>
          <View style={{
            width: 10,
            height: 10,
            borderRadius: 5,
            flexShrink: 0,
            backgroundColor: CHART_COLORS[i % CHART_COLORS.length],
          }} />
          <LegendColumn width={stacked ? undefined : NAME_COL_W} flex={stacked ? 1 : undefined} align="left">
            <Text style={{ ...T.caption, color: C.text }} numberOfLines={stacked ? 2 : 1}>
              {seg.label}
            </Text>
          </LegendColumn>
          <LegendColumn width={amountColW} align="center">
            <Text style={{ ...T.caption, color: C.primary, fontWeight: '600', textAlign: 'center', ...tabularNums }} numberOfLines={1}>
              {formatDashboardAmount(seg.value, frequency, currency, daysInMonth)}
            </Text>
          </LegendColumn>
          <LegendColumn width={shareColW} align="center">
            <Text style={{ ...T.caption, color: C.muted, fontWeight: '600', textAlign: 'center', ...tabularNums }} numberOfLines={1}>
              {formatSharePct(seg.value, total)}
            </Text>
          </LegendColumn>
        </View>
      ))}
    </View>
  );
}

/**
 * Donut chart + three-column legend (section, amount, %).
 */
export default function ExpensesDonutChart({
  segments,
  total,
  currency,
  frequency,
  daysInMonth,
  emptyLabel,
  nameLabel,
  amountLabel,
  shareLabel,
}) {
  const stacked = useIsDashboardNarrow();
  const { amountColW, shareColW } = useBreakdownTableColumns();

  const size = 228;
  const cx = size / 2;
  const cy = size / 2;
  const outerR = 96;
  const innerR = 62;

  const hasData = total > 0 && segments.length > 0;
  const displayTotal = formatDashboardAmount(total, frequency, currency, daysInMonth);

  let angle = 0;
  const arcs = hasData
    ? segments.map((seg, i) => {
        const sweep = (seg.value / total) * 360;
        const start = angle;
        const end = angle + sweep;
        angle = end;
        const d = donutSegmentPath(cx, cy, outerR, innerR, start, end);
        return (
          <Path
            key={seg.key}
            d={d}
            fill={CHART_COLORS[i % CHART_COLORS.length]}
          />
        );
      })
    : [];

  return (
    <View style={{
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      paddingVertical: CARD_PADDING,
      paddingHorizontal: CARD_PADDING,
    }}>
      <View style={{
        flexDirection: stacked ? 'column' : 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: stacked ? 16 : 20,
        width: '100%',
      }}>
        <View style={{
          width: size,
          height: size,
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            {!hasData ? (
              <>
                <Circle cx={cx} cy={cy} r={outerR} fill="none" stroke={C.border} strokeWidth={12} />
                <Circle cx={cx} cy={cy} r={innerR} fill={C.surface} />
              </>
            ) : (
              <G>{arcs}</G>
            )}
          </Svg>
          <View style={{ position: 'absolute', alignItems: 'center', maxWidth: innerR * 2 - 8 }}>
            <Text style={{ fontSize: 11, fontWeight: '500', color: C.muted, textAlign: 'center' }}>
              {hasData ? '' : emptyLabel}
            </Text>
            {hasData ? (
              <Text style={{ fontSize: 13, fontWeight: '700', color: C.primary, textAlign: 'center', ...tabularNums }}>
                {displayTotal}
              </Text>
            ) : null}
          </View>
        </View>

        {hasData ? (
          <View style={{
            width: stacked ? '100%' : undefined,
            maxWidth: stacked ? LEGEND_MAX_W : undefined,
            flexShrink: stacked ? undefined : 1,
            minWidth: stacked ? undefined : 0,
            alignSelf: stacked ? 'center' : undefined,
          }}>
            <LegendHeader
              nameLabel={nameLabel}
              amountLabel={amountLabel}
              shareLabel={shareLabel}
              stacked={stacked}
              amountColW={amountColW}
              shareColW={shareColW}
            />
            <LegendRows
              segments={segments}
              total={total}
              frequency={frequency}
              currency={currency}
              daysInMonth={daysInMonth}
              stacked={stacked}
              amountColW={amountColW}
              shareColW={shareColW}
            />
          </View>
        ) : (
          <Text style={{ ...T.helper }}>{emptyLabel}</Text>
        )}
      </View>
    </View>
  );
}
