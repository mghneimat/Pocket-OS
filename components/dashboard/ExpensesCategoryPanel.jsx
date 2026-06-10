import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { formatCurrency } from '../../lib/finance';
import { resolveCategorySectionId } from '../../lib/sectionEditRegistry';
import { buildExpenseChartSections, getExpenseAddTemplate } from '../../lib/expensePanels';
import { C, R, T } from '../../constants/onboarding-theme';
import DashboardSectionHeader from './DashboardSectionHeader';
import DashboardFrequencyToggle from './DashboardFrequencyToggle';
import ExpensesDonutChart from './ExpensesDonutChart';
import ExpensesCategoryBreakdown from './ExpensesCategoryBreakdown';
import LedgerDataTable from './LedgerDataTable';
import ExpenseItemEditPanel from './ExpenseItemEditPanel';
import PrimaryButton from '../ui/PrimaryButton';

function frequencyLabel(freq, t) {
  if (!freq) return t('common.monthly');
  const key = `common.${freq}`;
  const translated = t(key);
  return translated !== key ? translated : freq;
}

function formatDateCell(row, t) {
  if (row.endDate) return t('dashboard.expensesScreen.endsOn', { date: row.endDate });
  if (row.dueDate) return t('dashboard.expensesScreen.dueOn', { date: row.dueDate });
  if (row.renewalDate) return t('dashboard.expensesScreen.renewsOn', { date: row.renewalDate });
  return t('dashboard.expensesScreen.noDate');
}

function buildRowMeta(subtabKey, item, subtabLabel, sectionId) {
  return {
    id: item.id,
    category: subtabKey,
    categoryLabel: subtabLabel,
    rawAmount: item.rawAmount,
    frequency: item.frequency,
    monthlyAmount: item.monthlyAmount,
    renewalDate: item.renewalDate || null,
    dueDate: item.dueDate || null,
    endDate: item.endDate || null,
    source: item.source,
    editKind: item.editKind,
    editRef: item.editRef || null,
    dateType: item.dateType || null,
    supportsFrequency: item.supportsFrequency,
    sectionId: item.sectionId || sectionId || resolveCategorySectionId(subtabKey),
  };
}

export default function ExpensesCategoryPanel({
  variant,
  panels = [],
  displayTotal,
  categoryLabel,
  categoryKey,
  lineItems = [],
  sectionId,
  currency,
  currencyCode,
  t,
  frequency = 'monthly',
  setFrequency,
  daysInMonth = 30,
}) {
  const [adding, setAdding] = useState(false);
  const isOverview = variant === 'overview' || variant === 'overall';

  const panelTotal = useMemo(() => {
    if (isOverview) {
      return panels.reduce((sum, panel) => sum + panel.total, 0);
    }
    return lineItems.reduce((sum, item) => sum + item.monthlyAmount, 0);
  }, [isOverview, panels, lineItems]);

  const chartTotal = isOverview && displayTotal != null ? displayTotal : panelTotal;

  const chartSegments = useMemo(() => {
    if (!isOverview) return [];
    return buildExpenseChartSections(panels, t);
  }, [isOverview, panels, t]);

  const frequencyColumnLabel = t(`common.${frequency}`);

  const detailRows = useMemo(() => lineItems.map((item) => {
    const meta = buildRowMeta(categoryKey, item, categoryLabel, sectionId);
    return {
      ...meta,
      cells: {
        name: item.subcategory,
        amount: formatCurrency(item.rawAmount, currency),
        frequency: frequencyLabel(item.frequency, t),
        date: formatDateCell(meta, t),
      },
    };
  }), [lineItems, categoryKey, categoryLabel, sectionId, currency, t]);

  const detailColumns = [
    { key: 'name', label: t('dashboard.expensesScreen.table.name'), flex: 1 },
    { key: 'amount', label: t('dashboard.expensesScreen.table.amount'), flex: 1, align: 'center' },
    { key: 'frequency', label: t('common.frequency'), flex: 1, align: 'center' },
    { key: 'date', label: t('dashboard.expensesScreen.table.date'), flex: 1, align: 'center' },
  ];

  const addTemplate = categoryKey ? getExpenseAddTemplate(categoryKey, categoryLabel) : null;

  if (!isOverview && lineItems.length === 0 && !adding) {
    return (
      <View style={{
        marginTop: 24,
        padding: 20,
        borderRadius: R.card,
        borderWidth: 1,
        borderColor: C.border,
        backgroundColor: C.surface,
        alignItems: 'center',
        gap: 16,
      }}>
        <Text style={{ ...T.body, color: C.muted, textAlign: 'center' }}>
          {t('dashboard.expensesScreen.subtabEmpty', { type: categoryLabel })}
        </Text>
        <Text style={{ ...T.helper, color: C.muted, textAlign: 'center' }}>
          {t('dashboard.expensesScreen.emptyHint')}
        </Text>
        <PrimaryButton onPress={() => setAdding(true)}>
          {t('dashboard.expensesScreen.addExpense', { type: categoryLabel })}
        </PrimaryButton>
      </View>
    );
  }

  if (!isOverview && lineItems.length === 0 && adding && addTemplate) {
    return (
      <View style={{
        marginTop: 24,
        padding: 20,
        borderRadius: R.card,
        borderWidth: 1,
        borderColor: C.border,
        backgroundColor: C.surface,
      }}>
        <Text style={{ ...T.fieldLabel, marginBottom: 8 }}>
          {t('dashboard.expensesScreen.addExpense', { type: categoryLabel })}
        </Text>
        <Text style={{ ...T.helper, color: C.muted, marginBottom: 16 }}>
          {t('dashboard.expensesScreen.emptyHint')}
        </Text>
        <ExpenseItemEditPanel
          row={addTemplate}
          currency={currency}
          currencyCode={currencyCode}
          mode="add"
          categoryKey={categoryKey}
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
          <DashboardSectionHeader title={t('dashboard.expensesScreen.chartTitle')} />
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
              total={chartTotal}
              currency={currency}
              frequency={frequency}
              daysInMonth={daysInMonth}
              emptyLabel={t('dashboard.expensesScreen.empty')}
              nameLabel={t('dashboard.expensesScreen.table.expense')}
              amountLabel={frequencyColumnLabel}
              shareLabel={t('dashboard.expensesScreen.table.share')}
            />
          </View>
        </>
      ) : null}

      {isOverview ? (
        <ExpensesCategoryBreakdown
          title={t('dashboard.expensesScreen.tableTitle')}
          panels={panels}
          panelTotal={panelTotal}
          currency={currency}
          t={t}
          frequency={frequency}
          setFrequency={setFrequency}
          daysInMonth={daysInMonth}
          frequencyColumnLabel={frequencyColumnLabel}
          emptyLabel={t('dashboard.expensesScreen.empty')}
        />
      ) : (
        <LedgerDataTable
          columns={detailColumns}
          rows={detailRows}
          emptyLabel={t('dashboard.expensesScreen.empty')}
          editLabel={t('common.edit')}
          renderEditPanel={(row, { onDone, onCancel }) => (
            <ExpenseItemEditPanel
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
