import Svg, { Path } from 'react-native-svg';
import LucideStrokeIcon from './LucideStrokeIcon';
import {
  LAYOUT_DASHBOARD_NODES,
  CIRCLE_DOLLAR_SIGN_NODES,
  HANDBAG_NODES,
  SCALE_NODES,
  CLIPBOARD_CLOCK_NODES,
  GOAL_NODES,
  WALLET_NODES,
  CHART_LINE_NODES,
  CLIPBOARD_PEN_NODES,
  BELL_NODES,
  COLUMNS_2_NODES,
  LANGUAGES_NODES,
  STICKY_NOTE_X_NODES,
} from './lucidePaths';

function lucideNavIcon(nodes) {
  return function LucideNavIcon({ color, size = 18 }) {
    return <LucideStrokeIcon nodes={nodes} color={color} size={size} />;
  };
}

export const DashboardIcon = lucideNavIcon(LAYOUT_DASHBOARD_NODES);
export const IncomeIcon = lucideNavIcon(CIRCLE_DOLLAR_SIGN_NODES);
export const CostsIcon = lucideNavIcon(HANDBAG_NODES);
export const BudgetIcon = lucideNavIcon(SCALE_NODES);
export const TrackerIcon = lucideNavIcon(CLIPBOARD_CLOCK_NODES);
export const GoalsIcon = lucideNavIcon(GOAL_NODES);
export const SavingsIcon = lucideNavIcon(WALLET_NODES);
export const SummaryIcon = lucideNavIcon(CHART_LINE_NODES);
export const QuestionnaireIcon = lucideNavIcon(CLIPBOARD_PEN_NODES);
export const AlertsIcon = lucideNavIcon(BELL_NODES);
export const SidebarToggleIcon = lucideNavIcon(COLUMNS_2_NODES);
export const LanguagesIcon = lucideNavIcon(LANGUAGES_NODES);
export const RevokeConsentIcon = lucideNavIcon(STICKY_NOTE_X_NODES);

/** Panel + chevron left — collapse sidebar */
export function SidebarCollapseIcon({ color, size = 18 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 4h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5a1 1 0 011-1zm2 2v12h4V6H7zm6 0v12h4.5a.5.5 0 00.5-.5V6.5a.5.5 0 00-.5-.5H13z"
        fill={color}
      />
      <Path d="M11.5 12l-1.5-1.5 1.06-1.06L13.12 12l-1.56 1.56L11.5 12z" fill={color} />
    </Svg>
  );
}

/** Panel + chevron right — expand sidebar */
export function SidebarExpandIcon({ color, size = 18 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 4h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5a1 1 0 011-1zm2 2v12h4V6H7zm6 0v12h4.5a.5.5 0 00.5-.5V6.5a.5.5 0 00-.5-.5H13z"
        fill={color}
      />
      <Path d="M12.5 12l1.5-1.5-1.06-1.06L10.88 12l1.56 1.56L12.5 12z" fill={color} />
    </Svg>
  );
}

export function InfoIcon({ color, size = 22 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"
        fill={color}
      />
    </Svg>
  );
}

