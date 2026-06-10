/** Share of total at which a lone section is treated as dominant (auto-expanded). */
export const DOMINANT_SECTION_SHARE = 0.95;

/**
 * Section with zero or one line item — skip nested expand/collapse.
 * @param {{ items?: { id: string }[] }} section
 * @returns {boolean}
 */
export function isFlatBreakdownSection(section) {
  return (section.items?.length ?? 0) <= 1;
}

/**
 * Hide expand/collapse-all when every section is already flat.
 * @param {{ items?: { id: string }[] }[]} sections
 * @returns {boolean}
 */
export function shouldHideBreakdownExpandAll(sections) {
  if (!sections?.length) return true;
  return sections.every(isFlatBreakdownSection);
}

/**
 * Initial expand state for overview breakdown tables.
 * Single-section profiles start fully expanded; dominant two-section profiles expand the larger group.
 * @param {{ key: string, total: number, items?: { id: string }[] }[]} sections
 * @param {number} panelTotal
 * @returns {{ expanded: Record<string, boolean>, allExpanded: boolean }}
 */
export function buildInitialBreakdownExpandState(sections, panelTotal) {
  if (!sections?.length) {
    return { expanded: {}, allExpanded: false };
  }

  /** @type {Record<string, boolean>} */
  const expanded = {};
  sections.forEach((section) => {
    expanded[section.key] = isFlatBreakdownSection(section);
  });

  if (sections.length === 1) {
    return { expanded: { [sections[0].key]: true }, allExpanded: true };
  }

  if (panelTotal > 0 && sections.length === 2) {
    const dominant = sections.find((s) => s.total / panelTotal >= DOMINANT_SECTION_SHARE);
    if (dominant) {
      expanded[dominant.key] = true;
      return { expanded, allExpanded: false };
    }
  }

  return { expanded, allExpanded: false };
}
