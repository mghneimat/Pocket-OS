import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { formatCurrency } from '../../lib/finance';
import { buildIncomeChartSections, getOtherIncomeAddTemplate } from '../../lib/incomePanels';
import { C, R, T } from '../../constants/onboarding-theme';
import DashboardSectionHeader from './DashboardSectionHeader';
import DashboardFrequencyToggle from './DashboardFrequencyToggle';
import ExpensesDonutChart from './ExpensesDonutChart';
import IncomeStreamsBreakdown from './IncomeStreamsBreakdown';
import LedgerDataTable from './LedgerDataTable';
import IncomeItemEditPanel from './IncomeItemEditPanel';
import BreakdownEmptyState from './BreakdownEmptyState';

function frequencyLabel(freq, t) {
  if (!freq) return t('common.monthly');
  const key = `common.${freq}`;
  const translated = t(key);
  return translated !== key ? translated : freq;
}

export default function IncomeCategoryPanel({
  variant,
  panels = [],
  categoryLabel,
  lineItems = [],
  currency,
  currencyCode,
  t,
  frequency = 'monthly',
  setFrequency,
  daysInMonth = 30,
  emptyLabel,
  emptyHint,
  emptyActionLabel,
  showEmptyAdd = false,
}) {
  const isOverview = variant === 'overview';
  const [adding, setAdding] = useState(false);

  const panelTotal = useMemo(() => {
    if (isOverview) {
      return panels.reduce((sum, panel) => sum + panel.total, 0);
    }
    return lineItems.reduce((sum, item) => sum + item.monthlyAmount, 0);
  }, [isOverview, panels, lineItems]);

  const chartSegments = useMemo(() => {
    if (!isOverview) return [];
    return buildIncomeChartSections(panels);
  }, [isOverview, panels]);

  const frequencyColumnLabel = t(`common.${frequency}`);

  const detailRows = useMemo(() => lineItems.map((item) => ({
    id: item.id,
    editKind: item.editKind,
    otherIndex: item.otherIndex,
    showLabelField: item.showLabelField,
    rawAmount: item.rawAmount,
    frequency: item.frequency,
    subcategory: item.subcategory,
    monthlyAmount: item.monthlyAmount,
    cells: {
      name: item.subcategory,
      amount: formatCurrency(item.rawAmount, currency),
      frequency: frequencyLabel(item.frequency, t),
    },
  })), [lineItems, currency, t]);

  const detailColumns = [
    { key: 'name', label: t('dashboard.incomeScreen.table.source'), flex: 1 },
    { key: 'amount', label: t('dashboard.expensesScreen.table.amount'), flex: 1, align: 'center' },
    { key: 'frequency', label: t('common.frequency'), flex: 1, align: 'center' },
  ];

  if (!isOverview && lineItems.length === 0 && !adding) {
    return (
      <BreakdownEmptyState
        message={emptyLabel || t('dashboard.incomeScreen.emptyPanel')}
        hint={emptyHint}
        actionLabel={showEmptyAdd ? (emptyActionLabel || t('dashboard.incomeScreen.addOtherSource')) : null}
        onAction={showEmptyAdd ? () => setAdding(true) : undefined}
      />
    );
  }

  if (!isOverview && lineItems.length === 0 && adding && showEmptyAdd) {
    return (
      <View style={{
        marginTop: 24,
        padding: 20,
        borderRadius: R.card,
        borderWidth: 1,
        borderColor: C.border,
        backgroundColor: C.surface,
      }}>
        <Text style={{ ...T.fieldLabel, marginBottom: 16 }}>
          {emptyActionLabel || t('dashboard.incomeScreen.addOtherSource')}
        </Text>
        <IncomeItemEditPanel
          row={getOtherIncomeAddTemplate()}
          currency={currency}
          currencyCode={currencyCode}
          onDone={() => setAdding(false)}
          onCancel={() => setAdding(false)}
        />
      </View>
    );
  }

  return (
    <View style={{ marginTop: 16 }}>
      {isOverview ? (
        <>
          <DashboardSectionHeader title={t('dashboard.incomeScreen.chartTitle')} />
          <View style={{
            marginBottom: 16,
            borderRadius: R.card,
            borderWidth: 1,
            borderColor: C.border,
            backgroundColor: C.surface,
            overflow: 'hidden',
          }}>
            {setFrequency ? (
              <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 0 }}>
                <DashboardFrequencyToggle
                  value={frequency}
                  onChange={setFrequency}
                  style={{ marginTop: 0, marginBottom: 0 }}
                />
              </View>
            ) : null}
            <ExpensesDonutChart
              segments={chartSegments}
              total={panelTotal}
              currency={currency}
              frequency={frequency}
              daysInMonth={daysInMonth}
              emptyLabel={t('dashboard.incomeScreen.empty')}
              nameLabel={t('dashboard.incomeScreen.table.source')}
              amountLabel={frequencyColumnLabel}
              shareLabel={t('dashboard.incomeScreen.table.share')}
            />
          </View>
        </>
      ) : null}

      {isOverview ? (
        <IncomeStreamsBreakdown
          title={t('dashboard.incomeScreen.tableTitle')}
          streams={panels}
          panelTotal={panelTotal}
          currency={currency}
          t={t}
          frequency={frequency}
          setFrequency={setFrequency}
          daysInMonth={daysInMonth}
          frequencyColumnLabel={frequencyColumnLabel}
          emptyLabel={t('dashboard.incomeScreen.empty')}
        />
      ) : (
        <LedgerDataTable
          title={categoryLabel}
          columns={detailColumns}
          rows={detailRows}
          emptyLabel={emptyLabel || t('dashboard.incomeScreen.empty')}
          editLabel={t('common.edit')}
          renderEditPanel={(row, { onDone, onCancel }) => (
            <IncomeItemEditPanel
              row={row}
              currency={currency}
              currencyCode={currencyCode}
              onDone={onDone}
              onCancel={onCancel}
            />
          )}
        />
      )}
    </View>
  );
}
