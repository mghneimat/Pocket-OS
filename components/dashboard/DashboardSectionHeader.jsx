import { View } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { C } from '../../constants/onboarding-theme';

/** Shared subsection title style for all dashboard tabs. */
export const dashboardSectionTitleStyle = {
  fontSize: 17,
  fontWeight: '600',
  color: C.primary,
  flex: 1,
};

/**
 * Section-wide header with optional trailing actions and divider below.
 */
export default function DashboardSectionHeader({
  title,
  trailing,
  accessibilityRole = 'header',
  style,
  dividerStyle,
  contentStyle,
}) {
  return (
    <View style={style}>
      <View style={[{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        paddingBottom: 12,
      }, contentStyle]}>
        <Text
          accessibilityRole={accessibilityRole}
          style={dashboardSectionTitleStyle}
          numberOfLines={2}
        >
          {title}
        </Text>
        {trailing ?? null}
      </View>
      <View style={[{
        height: 1,
        backgroundColor: C.divider,
        marginBottom: 16,
      }, dividerStyle]} />
    </View>
  );
}
