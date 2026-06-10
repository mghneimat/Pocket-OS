import { Platform } from 'react-native';

/**
 * Cross-platform elevation shadow (web uses boxShadow per RN deprecation).
 *
 * @param {Object} [opts]
 * @param {number} [opts.offsetX=0]
 * @param {number} [opts.offsetY=4]
 * @param {number} [opts.blur=8]
 * @param {number} [opts.opacity=0.08]
 */
export function elevationShadow({ offsetX = 0, offsetY = 4, blur = 8, opacity = 0.08 } = {}) {
  if (Platform.OS === 'web') {
    return { boxShadow: `${offsetX}px ${offsetY}px ${blur}px rgba(0,0,0,${opacity})` };
  }
  return {
    shadowColor: '#000',
    shadowOffset: { width: offsetX, height: offsetY },
    shadowOpacity: opacity,
    shadowRadius: blur,
    elevation: Math.max(2, Math.ceil(blur / 2)),
  };
}
