import { useMemo, useState, useEffect } from 'react';
import { View, Pressable, Platform } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { buildIncomeSectionGroups } from '../../lib/incomePanels';
import {
  exportIncomeBreakdownCsv,
  exportIncomeBreakdownXlsx,
  exportIncomeBreakdownPdf,
} from '../../lib/incomeBreakdownExport';
import {
  buildInitialBreakdownExpandState,
  isFlatBreakdownSection,
  shouldHideBreakdownExpandAll,
} from '../../lib/breakdownExpand';
import BudgetExpandChevron from '../onboarding/BudgetExpandChevron';
import AnimatedCollapse from './AnimatedCollapse';
import DashboardSectionHeader from './DashboardSectionHeader';
import DashboardTableExportActions from './DashboardTableExportActions';
import DashboardFrequencyToggle from './DashboardFrequencyToggle';
import { formatDashboardAmount } from './formatDashboardAmount';
import { formatSharePct } from '../../lib/formatSharePct';
import { useBreakdownTableColumns } from '../../lib/dashboardLayout';
import { C, R, T, tabularNums } from '../../constants/onboarding-theme';
import { BreakdownCell, BreakdownRow } from './BreakdownTablePrimitives';

const EMPTY_ROW_HEIGHT = 44;

/**
 * Expandable income breakdown — Main income / Other sources with line items.
 */
export default function IncomeStreamsBreakdown({
  title,
  streams,
  panelTotal,
  currency,
  t,
  frequency = 'monthly',
  setFrequency,
  daysInMonth = 30,
  frequencyColumnLabel,
  emptyLabel,
}) {
  const sections = useMemo(
    () => buildIncomeSectionGroups(streams, t),
    [streams, t],
  );

  const initialExpand = useMemo(
    () => buildInitialBreakdownExpandState(sections, panelTotal),
    [sections, panelTotal],
  );

  const [expanded, setExpanded] = useState(initialExpand.expanded);
  const [allExpanded, setAllExpanded] = useState(initialExpand.allExpanded);
  const { narrow, amountColW, shareColW, tableMaxW } = useBreakdownTableColumns();

  useEffect(() => {
    setExpanded(initialExpand.expanded);
    setAllExpanded(initialExpand.allExpanded);
  }, [initialExpand]);

  const hasData = sections.length > 0;
  const hideExpandAll = shouldHideBreakdownExpandAll(sections);
  const amountHeader = frequencyColumnLabel || t(`common.${frequency}`);

  const toggle = (key) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleAll = () => {
    const next = !allExpanded;
    setAllExpanded(next);
    const nextExpanded = {};
    sections.forEach((section) => {
      nextExpanded[section.key] = next;
    });
    setExpanded(nextExpanded);
  };

  const toggleLabel = (label, isOpen) => (
    isOpen
      ? t('onboarding.budget.q14.a11y.collapseRow', { label })
      : t('onboarding.budget.q14.a11y.expandRow', { label })
  );

  const exportMeta = {
    title: title || t('dashboard.incomeScreen.tableTitle'),
    summaryTitle: t('dashboard.incomeScreen.table.source'),
    amountTitle: amountHeader,
    currency,
  };

  const handleExportCsv = () => exportIncomeBreakdownCsv(streams, t, exportMeta);
  const handleExportXlsx = () => exportIncomeBreakdownXlsx(streams, t, exportMeta);
  const handleExportPdf = () => exportIncomeBreakdownPdf(streams, t, exportMeta);

  return (
    <View style={{ marginBottom: 20 }}>
      {title ? (
        <DashboardSectionHeader
          title={title}
          trailing={hasData ? (
            <DashboardTableExportActions
              onExportCsv={handleExportCsv}
              onExportXlsx={handleExportXlsx}
              onExportPdf={handleExportPdf}
            />
          ) : null}
          dividerStyle={{ marginBottom: 12 }}
        />
      ) : null}

      {setFrequency ? (
        <DashboardFrequencyToggle
          value={frequency}
          onChange={setFrequency}
          style={{ marginTop: 0, marginBottom: 12 }}
        />
      ) : null}

      <View style={{
        borderWidth: 1,
        borderColor: C.border,
        borderRadius: R.card,
        overflow: 'hidden',
        backgroundColor: C.surface,
      }}>
        {hasData && !hideExpandAll ? (
          <Pressable
            onPress={toggleAll}
            accessibilityRole="button"
            accessibilityLabel={allExpanded
              ? t('onboarding.budget.q14.a11y.collapseAll')
              : t('onboarding.budget.q14.a11y.expandAll')}
            style={({ pressed, hovered }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: 12,
              minHeight: 44,
              backgroundColor: pressed
                ? C.overlayPressed
                : hovered
                  ? C.overlayHover
                  : C.bg,
              borderBottomWidth: 1,
              borderBottomColor: C.divider,
              ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
            })}
          >
            <Text style={{ fontSize: 12, fontWeight: '600', color: C.primary, marginRight: 6 }}>
              {allExpanded
                ? t('onboarding.budget.q14.collapseAll')
                : t('onboarding.budget.q14.expandAll')}
            </Text>
            <BudgetExpandChevron expanded={allExpanded} />
          </Pressable>
        ) : null}

        <View style={{
          paddingVertical: 10,
          paddingHorizontal: 14,
          backgroundColor: C.bg,
          borderBottomWidth: 1,
          borderBottomColor: C.divider,
        }}>
          <BreakdownRow tableMaxW={tableMaxW}>
            <BreakdownCell flex={1} narrow={narrow}>
              <Text style={{ ...T.caption, fontWeight: '600', color: C.muted }} numberOfLines={1}>
                {t('dashboard.incomeScreen.table.source')}
              </Text>
            </BreakdownCell>
            <BreakdownCell width={amountColW} align="center" narrow={narrow}>
              <Text style={{ ...T.caption, fontWeight: '600', color: C.muted, textAlign: 'center' }} numberOfLines={1}>
                {amountHeader}
              </Text>
            </BreakdownCell>
            <BreakdownCell width={shareColW} align="center" narrow={narrow}>
              <Text style={{ ...T.caption, fontWeight: '600', color: C.muted, textAlign: 'center' }} numberOfLines={1}>
                {t('dashboard.incomeScreen.table.share')}
              </Text>
            </BreakdownCell>
          </BreakdownRow>
        </View>

        {!hasData ? (
          <Text style={{ ...T.helper, textAlign: 'center', paddingVertical: 24, paddingHorizontal: 16 }}>
            {emptyLabel}
          </Text>
        ) : (
          <>
            {sections.map((section, sectionIdx) => {
              const flat = isFlatBreakdownSection(section);
              const isOpen = flat || (expanded[section.key] ?? false);
              const sectionPct = formatSharePct(section.total, panelTotal);

              const headerRow = (
                <BreakdownRow tableMaxW={tableMaxW}>
                  <BreakdownCell flex={1} narrow={narrow}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', flexShrink: 1, minWidth: 0 }}>
                      <Text style={{ fontSize: 15, fontWeight: '600', color: C.primary, flexShrink: 1 }} numberOfLines={2}>
                        {section.label}
                      </Text>
                      {!flat ? <BudgetExpandChevron expanded={isOpen} /> : null}
                    </View>
                  </BreakdownCell>
                  <BreakdownCell width={amountColW} align="center" narrow={narrow}>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: C.primary, textAlign: 'center', ...tabularNums }} numberOfLines={1}>
                      {formatDashboardAmount(section.total, frequency, currency, daysInMonth)}
                    </Text>
                  </BreakdownCell>
                  <BreakdownCell width={shareColW} align="center" narrow={narrow}>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: C.muted, textAlign: 'center', ...tabularNums }}>
                      {sectionPct}
                    </Text>
                  </BreakdownCell>
                </BreakdownRow>
              );

              const headerStyle = ({ pressed, hovered }) => ({
                paddingVertical: 12,
                paddingHorizontal: 14,
                minHeight: 44,
                backgroundColor: flat
                  ? C.surface
                  : pressed
                    ? C.overlayPressed
                    : hovered
                      ? C.overlayHover
                      : C.surface,
                ...(Platform.OS === 'web' && !flat ? { cursor: 'pointer' } : {}),
              });

              return (
                <View key={section.key} style={{ borderTopWidth: sectionIdx > 0 ? 1 : 0, borderTopColor: C.divider }}>
                  {flat ? (
                    <View style={headerStyle({})}>{headerRow}</View>
                  ) : (
                    <Pressable
                      onPress={() => toggle(section.key)}
                      accessibilityRole="button"
                      accessibilityLabel={toggleLabel(section.label, isOpen)}
                      accessibilityState={{ expanded: isOpen }}
                      style={headerStyle}
                    >
                      {headerRow}
                    </Pressable>
                  )}

                  <AnimatedCollapse
                    visible={isOpen}
                    fallbackHeight={Math.max(section.items.length * 40, 40)}
                  >
                    {section.items.map((item, itemIdx) => {
                      const itemPct = formatSharePct(item.monthlyAmount, panelTotal);
                      const isLast = itemIdx === section.items.length - 1;
                      return (
                        <View
                          key={item.id}
                          style={{
                            paddingVertical: 8,
                            paddingHorizontal: 14,
                            backgroundColor: C.bg,
                            borderTopWidth: 1,
                            borderTopColor: C.divider,
                            borderBottomWidth: isLast ? 1 : 0,
                            borderBottomColor: C.divider,
                          }}
                        >
                          <BreakdownRow style={{ paddingLeft: narrow ? 8 : 14 }} tableMaxW={tableMaxW}>
                            <BreakdownCell flex={1} narrow={narrow}>
                              <Text style={{ ...T.caption, color: C.muted }} numberOfLines={2}>
                                {item.label}
                              </Text>
                            </BreakdownCell>
                            <BreakdownCell width={amountColW} align="center" narrow={narrow}>
                              <Text style={{ ...T.caption, color: C.text, fontWeight: '500', textAlign: 'center', ...tabularNums }} numberOfLines={1}>
                                {formatDashboardAmount(item.monthlyAmount, frequency, currency, daysInMonth)}
                              </Text>
                            </BreakdownCell>
                            <BreakdownCell width={shareColW} align="center" narrow={narrow}>
                              <Text style={{ ...T.caption, color: C.muted, fontWeight: '500', textAlign: 'center', ...tabularNums }}>
                                {itemPct}
                              </Text>
                            </BreakdownCell>
                          </BreakdownRow>
                        </View>
                      );
                    })}
                  </AnimatedCollapse>
                </View>
              );
            })}
            <View style={{
              minHeight: EMPTY_ROW_HEIGHT,
              backgroundColor: C.surface,
              borderTopWidth: 1,
              borderTopColor: C.divider,
            }} />
          </>
        )}
      </View>
    </View>
  );
}
