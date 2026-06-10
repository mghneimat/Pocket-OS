import { View } from 'react-native';
import { C, R, S } from '../../constants/onboarding-theme';

/**
 * Flat bordered container — token-aligned card (no ghost shadow).
 */
export function SurfaceCard({ children, style, padded = true }) {
  return (
    <View
      style={{
        backgroundColor: C.surface,
        borderRadius: R.card,
        borderWidth: 1,
        borderColor: C.border,
        padding: padded ? S.cardPad : 0,
        overflow: 'hidden',
        ...style,
      }}
    >
      {children}
    </View>
  );
}

export default SurfaceCard;
