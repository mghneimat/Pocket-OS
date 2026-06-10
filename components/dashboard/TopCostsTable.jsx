import { useState } from 'react';
import { View, Pressable, Platform } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { useI18n } from '../../lib/i18n';
import { toMonthly } from '../../lib/finance';
import { categoryMonthlyTotal } from '../../lib/householdBudget';
import { useDashboardFrequency } from '../../lib/useDashboardFrequency';
import { C, R, T, tabularNums } from '../../constants/onboarding-theme';
import SurfaceCard from '../ui/SurfaceCard';
import DashboardSectionHeader from './DashboardSectionHeader';
import DashboardFrequencyToggle from './DashboardFrequencyToggle';
import { formatDashboardAmount } from './formatDashboardAmount';

export default function TopCostsTable({ categories, currency, daysInMonth, limit = 5 }) {
  const { t } = useI18n();
  const { frequency, setFrequency } = useDashboardFrequency('monthly');
  const [expanded, setExpanded] = useState({});

  const rows = [...categories]
    .map((cat) => ({ ...cat, monthlyTotal: categoryMonthlyTotal(cat) }))
    .filter((cat) => cat.monthlyTotal > 0)
    .sort((a, b) => b.monthlyTotal - a.monthlyTotal)
    .slice(0, limit);

  if (!rows.length) return null;

  const toggle = (key) => setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <View style={{ marginBottom: 16 }}>
      <DashboardSectionHeader title={t('dashboard.home.topCosts')} />
      <SurfaceCard>
      <DashboardFrequencyToggle value={frequency} onChange={setFrequency} style={{ marginTop: 0, marginBottom: 14 }} />

      <View style={{
        borderWidth: 1,
        borderColor: C.border,
        borderRadius: R.input,
        overflow: 'hidden',
      }}>
        <View style={{
          flexDirection: 'row',
          paddingVertical: 10,
          paddingHorizontal: 12,
          backgroundColor: C.bg,
          borderBottomWidth: 1,
          borderBottomColor: C.divider,
        }}>
          <Text style={{ ...T.caption, fontWeight: '600', color: C.muted, flex: 1 }}>
            {t('dashboard.home.table.category')}
          </Text>
          <Text style={{ ...T.caption, fontWeight: '600', color: C.muted, minWidth: 100, textAlign: 'right' }}>
            {t(`dashboard.home.table.per${frequency}`)}
          </Text>
        </View>

        {rows.map((cat, idx) => {
          const isOpen = expanded[cat.category];
          const amount = formatDashboardAmount(cat.monthlyTotal, frequency, currency, daysInMonth);

          return (
            <View key={cat.category} style={{ borderTopWidth: idx > 0 ? 1 : 0, borderTopColor: C.divider }}>
              <Pressable
                onPress={() => toggle(cat.category)}
                accessibilityRole="button"
                accessibilityState={{ expanded: isOpen }}
                style={({ pressed, hovered }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 12,
                  paddingHorizontal: 12,
                  backgroundColor: pressed ? C.overlayPressed : hovered ? C.overlayHover : C.surface,
                  ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
                })}
              >
                <Text style={{ flex: 1, fontSize: 15, fontWeight: '600', color: C.primary }} numberOfLines={2}>
                  {cat.label}
                </Text>
                <Text style={{ fontSize: 15, fontWeight: '600', color: C.primary, marginRight: 8, ...tabularNums }}>
                  {amount}
                </Text>
                <Text style={{ fontSize: 11, color: C.muted, width: 14, textAlign: 'center' }}>
                  {isOpen ? '▲' : '▼'}
                </Text>
              </Pressable>

              {isOpen ? (
                <View style={{ paddingHorizontal: 12, paddingBottom: 10, backgroundColor: C.bg }}>
                  {cat.items.map((item, itemIdx) => (
                    <View
                      key={`${item.label}-${itemIdx}`}
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        gap: 12,
                        paddingVertical: 6,
                        borderTopWidth: itemIdx > 0 ? 1 : 0,
                        borderTopColor: C.divider,
                      }}
                    >
                      <Text style={{ ...T.caption, color: C.muted, flex: 1 }} numberOfLines={2}>
                        {item.label}
                      </Text>
                      <Text style={{ ...T.caption, fontWeight: '500', color: C.text, ...tabularNums }}>
                        {formatDashboardAmount(toMonthly(item.amount, item.frequency), frequency, currency, daysInMonth)}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : null}
            </View>
          );
        })}
      </View>
      </SurfaceCard>
    </View>
  );
}
