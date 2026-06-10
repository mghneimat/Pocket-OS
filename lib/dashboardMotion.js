import { Easing } from 'react-native-reanimated';

export const DASHBOARD_MOTION_DURATION = 280;
export const DASHBOARD_MOTION_DURATION_FAST = 220;
export const DASHBOARD_MOTION_EASE = Easing.bezier(0.16, 1, 0.3, 1);

export const DASHBOARD_ENTER = {
  forward: { opacity: 0, translateY: 18, translateX: 0 },
  back: { opacity: 0, translateY: -14, translateX: 0 },
  lateral: { opacity: 0, translateY: 8, translateX: 14 },
  none: { opacity: 0, translateY: 10, translateX: 0 },
};
