import { View, Text } from 'react-native';
import { C } from '../../constants/onboarding-theme';

/** Compact expand/collapse indicator — sits beside the label, not at column edge. */
export default function BudgetExpandChevron({ expanded }) {
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no"
      style={{
        width: 22,
        height: 22,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 6,
        flexShrink: 0,
      }}
    >
      <Text style={{ fontSize: 10, fontWeight: '700', color: C.primary, lineHeight: 12 }}>
        {expanded ? '▲' : '▼'}
      </Text>
    </View>
  );
}
