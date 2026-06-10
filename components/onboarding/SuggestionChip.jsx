import { Pressable, Text, View } from 'react-native';
import { C } from '../../constants/onboarding-theme';

/**
 * Toggle suggestion chip used in onboarding quick-add rows (children-costs, pets, etc.).
 *
 * @param {string} label - Chip label
 * @param {boolean} active - Selected / expanded state
 * @param {Function} onPress - Toggle handler
 * @param {object} [style] - Extra Pressable styles (e.g. width: '48%')
 */
export default function SuggestionChip({ label, active, onPress, style }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        width: '48%',
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: active ? C.primary : pressed ? C.placeholder : C.border,
        backgroundColor: active ? C.chipSelectedBg : pressed ? C.bg : C.surface,
        marginBottom: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        ...style,
      })}
    >
      <Text style={{
        fontSize: 13,
        fontWeight: active ? '600' : '500',
        color: active ? C.primary : C.muted,
        marginRight: active ? 6 : 0,
      }}>
        {label}
      </Text>
      {active ? (
        <View style={{
          width: 18,
          height: 18,
          borderRadius: 9,
          backgroundColor: C.primary,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '700' }}>{'✓'}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}
