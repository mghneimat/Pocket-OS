import { formatCurrency } from './finance';
import { buildExpenseSectionGroups } from './expensePanels';
import { exportBudgetCsv, exportBudgetXlsx, exportBudgetPdf } from './budgetExport';

/**
 * @param {import('./expensePanels').ExpensePanel[]} panels
 * @param {(key: string) => string} t
 * @param {string} currencyCode
 */
export function buildExpenseBreakdownExportRows(panels, t, currencyCode) {
  const sections = buildExpenseSectionGroups(panels, t);
  /** @type {import('./budgetExport').BudgetExportRow[]} */
  const rows = [];

  sections.forEach((section) => {
    const sectionAmount = formatCurrency(Math.abs(section.total), '').trim();
    rows.push({
      level: 'category',
      label: section.label,
      amount: sectionAmount,
      currency: currencyCode,
      tone: 'expense',
    });
    section.items.forEach((item) => {
      const itemAmount = formatCurrency(Math.abs(item.monthlyAmount), '').trim();
      rows.push({
        level: 'item',
        label: item.label,
        amount: itemAmount,
        currency: currencyCode,
        tone: 'expense',
      });
    });
  });

  return rows;
}

/**
 * @param {import('./expensePanels').ExpensePanel[]} panels
 * @param {(key: string) => string} t
 * @param {{ title: string, summaryTitle: string, amountTitle: string, currency: string }} meta
 */
function buildMeta(panels, t, meta) {
  return {
    ...meta,
    fileBaseName: 'expense-breakdown',
    sheetName: 'Expenses',
  };
}

export async function exportExpenseBreakdownCsv(panels, t, meta) {
  const rows = buildExpenseBreakdownExportRows(panels, t, meta.currency);
  await exportBudgetCsv(rows, buildMeta(panels, t, meta));
}

export async function exportExpenseBreakdownXlsx(panels, t, meta) {
  const rows = buildExpenseBreakdownExportRows(panels, t, meta.currency);
  await exportBudgetXlsx(rows, buildMeta(panels, t, meta));
}

export async function exportExpenseBreakdownPdf(panels, t, meta) {
  const rows = buildExpenseBreakdownExportRows(panels, t, meta.currency);
  await exportBudgetPdf(rows, buildMeta(panels, t, meta));
}
