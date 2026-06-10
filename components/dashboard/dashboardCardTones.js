import { C } from '../../constants/onboarding-theme';

/** Subtle tinted surfaces for dashboard snapshot cards — ledger palette, not loud UI. */
export const DASHBOARD_CARD_TONES = {
  income: {
    bg: '#ECFDF5',
    bgHover: '#D1FAE5',
    bgPressed: '#A7F3D0',
    border: '#A7F3D0',
    borderActive: '#34D399',
    accent: '#10B981',
    valueColor: '#047857',
    iconColor: '#059669',
  },
  expense: {
    bg: '#FEF2F2',
    bgHover: '#FEE2E2',
    bgPressed: '#FECACA',
    border: '#FECACA',
    borderActive: '#F87171',
    accent: '#EF4444',
    valueColor: '#B91C1C',
    iconColor: '#DC2626',
  },
  goal: {
    bg: '#EFF6FF',
    bgHover: '#DBEAFE',
    bgPressed: '#BFDBFE',
    border: '#BFDBFE',
    borderActive: '#60A5FA',
    accent: '#2563EB',
    valueColor: '#1E40AF',
    iconColor: '#2563EB',
  },
  flexibility: {
    bg: '#F5F8FC',
    bgHover: '#E8EEF8',
    bgPressed: '#D1DCF0',
    border: '#C7D7F0',
    borderActive: C.chipSelectedBorder,
    accent: C.primary,
    valueColor: C.primary,
    iconColor: C.primary,
  },
};

/**
 * @param {'income'|'expense'|'goal'|'flexibility'|undefined} tone
 * @param {{ hovered: boolean, pressed: boolean }} state
 */
export function resolveDashboardCardTone(tone, { hovered, pressed }) {
  if (!tone || !DASHBOARD_CARD_TONES[tone]) return null;
  const palette = DASHBOARD_CARD_TONES[tone];
  return {
    backgroundColor: pressed ? palette.bgPressed : hovered ? palette.bgHover : palette.bg,
    borderColor: hovered || pressed ? palette.borderActive : palette.border,
    borderLeftWidth: 3,
    borderLeftColor: palette.accent,
    valueColor: palette.valueColor,
    iconColor: palette.iconColor,
  };
}
