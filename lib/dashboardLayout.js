import { useWindowDimensions } from 'react-native';

/** Matches app shell — sidebar drawer + stacked dashboard layouts below this width. */
export const DASHBOARD_WIDE_BREAKPOINT = 768;

export function useIsDashboardNarrow() {
  const { width } = useWindowDimensions();
  return width < DASHBOARD_WIDE_BREAKPOINT;
}

/** Column widths for breakdown / chart legend tables on narrow vs wide viewports. */
export function useBreakdownTableColumns() {
  const narrow = useIsDashboardNarrow();
  return {
    narrow,
    amountColW: narrow ? 72 : 88,
    shareColW: narrow ? 58 : 80,
    tableMaxW: narrow ? undefined : 420,
  };
}
