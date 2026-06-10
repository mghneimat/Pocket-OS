import { Platform } from 'react-native';

/** Native animated driver is unavailable on web; using it logs a warning and falls back anyway. */
export const USE_NATIVE_DRIVER = Platform.OS !== 'web';
