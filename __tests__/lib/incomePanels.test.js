import {
  buildPrimaryIncomePanels,
  buildOtherIncomePanels,
  buildOverviewIncomePanels,
  buildIncomeChartSections,
  buildIncomeSectionGroups,
} from '../../lib/incomePanels';

const t = (key, params) => {
  if (key === 'dashboard.incomeScreen.namedIncome') return `${params.name}'s income`;
  if (key === 'sectionEdit.income.yourIncome') return 'Your income';
  if (key === 'sectionEdit.income.partnerIncome') return 'Partner income';
  if (key === 'dashboard.incomeScreen.otherSource') return `Other source ${params.n}`;
  return key;
};

describe('incomePanels', () => {
  const household = { type: 'partner', displayName: 'Alex', partnerName: 'Sam' };
  const inc = {
    amount: 3000,
    frequency: 'monthly',
    partnerAmount: 2000,
    partnerFrequency: 'monthly',
    otherIncomeRows: [
      { label: 'Freelance', amount: 500, frequency: 'monthly' },
      { amount: 100, frequency: 'weekly' },
    ],
  };

  test('buildPrimaryIncomePanels includes user and partner', () => {
    const panels = buildPrimaryIncomePanels(inc, household, t);
    expect(panels).toHaveLength(2);
    expect(panels[0].key).toBe('user');
    expect(panels[0].total).toBe(3000);
    expect(panels[1].key).toBe('partner');
    expect(panels[1].total).toBe(2000);
  });

  test('buildOtherIncomePanels uses labels or fallbacks', () => {
    const panels = buildOtherIncomePanels(inc, t);
    expect(panels).toHaveLength(2);
    expect(panels[0].label).toBe('Freelance');
    expect(panels[1].label).toBe('Other source 2');
  });

  test('buildOverviewIncomePanels merges primary and other', () => {
    const panels = buildOverviewIncomePanels(inc, household, t);
    expect(panels.length).toBe(4);
  });

  test('buildIncomeChartSections filters zero and sorts desc', () => {
    const panels = buildOverviewIncomePanels(
      { amount: 0, frequency: 'monthly', otherIncomeRows: [{ amount: 100, frequency: 'monthly' }] },
      null,
      t,
    );
    const sections = buildIncomeChartSections(panels);
    expect(sections).toHaveLength(1);
    expect(sections[0].value).toBe(100);
  });

  test('buildIncomeSectionGroups groups primary and other streams', () => {
    const panels = buildOverviewIncomePanels(inc, household, t);
    const groups = buildIncomeSectionGroups(panels, t);
    expect(groups).toHaveLength(2);
    expect(groups[0].key).toBe('primary');
    expect(groups[0].items).toHaveLength(2);
    expect(groups[1].key).toBe('other');
    expect(groups[1].items).toHaveLength(2);
  });

  test('buildIncomeSectionGroups with only partner income yields one primary section', () => {
    const panels = buildOverviewIncomePanels(
      { amount: 0, frequency: 'monthly', partnerAmount: 5000, partnerFrequency: 'monthly' },
      household,
      t,
    );
    const groups = buildIncomeSectionGroups(panels, t);
    expect(groups).toHaveLength(1);
    expect(groups[0].key).toBe('primary');
    expect(groups[0].items).toHaveLength(1);
    expect(groups[0].items[0].label).toBe('Partner income');
  });
});
