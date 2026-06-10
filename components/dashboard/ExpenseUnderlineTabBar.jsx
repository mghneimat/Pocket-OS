import { View, Pressable, ScrollView } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { tabItemStyle } from '../../lib/pressableHover';
import { C, T } from '../../constants/onboarding-theme';

/**
 * Underline-style tab row — matches nested expenses navigation pattern.
 */
export default function ExpenseUnderlineTabBar({ tabs, activeKey, onChange, accessibilityLabel }) {
  if (!tabs.length) return null;

  return (
    <View
      style={{ borderBottomWidth: 1, borderBottomColor: C.border }}
      accessibilityRole="tablist"
      accessibilityLabel={accessibilityLabel}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        {tabs.map((tab) => {
          const selected = activeKey === tab.key;
          return (
            <Pressable
              key={tab.key}
              onPress={() => onChange(tab.key)}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              accessibilityLabel={tab.label}
              style={({ pressed, hovered }) => tabItemStyle({ pressed, hovered, selected })}
            >
              {({ pressed, hovered }) => (
                <Text style={{
                  ...T.body,
                  fontSize: 15,
                  fontWeight: selected ? '600' : '500',
                  color: selected ? C.primary : (hovered ? C.primary : C.muted),
                  opacity: pressed ? 0.75 : 1,
                }}>
                  {tab.label}
                </Text>
              )}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
