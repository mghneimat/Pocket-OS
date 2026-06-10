import {
  buildInitialBreakdownExpandState,
  isFlatBreakdownSection,
  shouldHideBreakdownExpandAll,
  DOMINANT_SECTION_SHARE,
} from '../../lib/breakdownExpand';

describe('breakdownExpand', () => {
  test('isFlatBreakdownSection is true for zero or one item', () => {
    expect(isFlatBreakdownSection({ items: [] })).toBe(true);
    expect(isFlatBreakdownSection({ items: [{ id: 'a' }] })).toBe(true);
    expect(isFlatBreakdownSection({ items: [{ id: 'a' }, { id: 'b' }] })).toBe(false);
  });

  test('single section starts fully expanded', () => {
    const sections = [{ key: 'primary', total: 50000, items: [{ id: 'user' }] }];
    expect(buildInitialBreakdownExpandState(sections, 50000)).toEqual({
      expanded: { primary: true },
      allExpanded: true,
    });
  });

  test('dominant two-section profile expands the larger group', () => {
    const sections = [
      { key: 'primary', total: 95000, items: [{ id: 'user' }, { id: 'partner' }] },
      { key: 'other', total: 5000, items: [{ id: 'other_0' }] },
    ];
    const result = buildInitialBreakdownExpandState(sections, 100000);
    expect(result.expanded.primary).toBe(true);
    expect(result.allExpanded).toBe(false);
    expect(95000 / 100000).toBeGreaterThanOrEqual(DOMINANT_SECTION_SHARE);
  });

  test('shouldHideBreakdownExpandAll when every section is flat', () => {
    const sections = [
      { key: 'a', items: [{ id: '1' }] },
      { key: 'b', items: [] },
    ];
    expect(shouldHideBreakdownExpandAll(sections)).toBe(true);
    expect(shouldHideBreakdownExpandAll([
      { key: 'a', items: [{ id: '1' }, { id: '2' }] },
    ])).toBe(false);
  });
});
