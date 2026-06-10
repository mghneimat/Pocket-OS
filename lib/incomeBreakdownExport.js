import { formatCurrency } from './finance';
import { buildIncomeSectionGroups } from './incomePanels';
import { exportBudgetCsv, exportBudgetXlsx, exportBudgetPdf } from './budgetExport';

/**
 * @param {import('./incomePanels').IncomePanel[]} panels
 * @param {(key: string) => string} t
 * @param {string} currencyCode
 */
export function buildIncomeBreakdownExportRows(panels, t, currencyCode) {
  const sections = buildIncomeSectionGroups(panels, t);
  /** @type {import('./budgetExport').BudgetExportRow[]} */
  const rows = [];

  sections.forEach((section) => {
    const sectionAmount = formatCurrency(Math.abs(section.total), '').trim();
    rows.push({
      level: 'category',
      label: section.label,
      amount: sectionAmount,
      currency: currencyCode,
      tone: 'income',
    });
    section.items.forEach((item) => {
      const itemAmount = formatCurrency(Math.abs(item.monthlyAmount), '').trim();
      rows.push({
        level: 'item',
        label: item.label,
        amount: itemAmount,
        currency: currencyCode,
        tone: 'income',
      });
    });
  });

  return rows;
}

/**
 * @param {import('./incomePanels').IncomePanel[]} panels
 * @param {(key: string) => string} t
 * @param {{ title: string, summaryTitle: string, amountTitle: string, currency: string }} meta
 */
function buildMeta(panels, t, meta) {
  return {
    ...meta,
    fileBaseName: 'income-breakdown',
    sheetName: 'Income',
  };
}

export async function exportIncomeBreakdownCsv(panels, t, meta) {
  const rows = buildIncomeBreakdownExportRows(panels, t, meta.currency);
  await exportBudgetCsv(rows, buildMeta(panels, t, meta));
}

export async function exportIncomeBreakdownXlsx(panels, t, meta) {
  const rows = buildIncomeBreakdownExportRows(panels, t, meta.currency);
  await exportBudgetXlsx(rows, buildMeta(panels, t, meta));
}

export async function exportIncomeBreakdownPdf(panels, t, meta) {
  const rows = buildIncomeBreakdownExportRows(panels, t, meta.currency);
  await exportBudgetPdf(rows, buildMeta(panels, t, meta));
}
