import { View, Pressable, Platform } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, R, S, T } from '../../constants/onboarding-theme';

/**
 * Centered overlay shell for in-app section editing (similar to MetricExplainModal).
 */
export default function SectionEditShell({
  title,
  onClose,
  closeA11y,
  children,
}) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: S.pagePadH,
        paddingTop: Math.max(insets.top, 12),
        paddingBottom: Math.max(insets.bottom, 12),
        backgroundColor: 'rgba(30,58,95,0.35)',
      }}
    >
      <Pressable
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel={closeA11y}
      />
      <View
        style={{
          width: '100%',
          maxWidth: 720,
          height: '92%',
          maxHeight: 860,
          backgroundColor: C.surface,
          borderRadius: R.card,
          borderWidth: 1,
          borderColor: C.border,
          overflow: 'hidden',
          ...(Platform.OS === 'web' ? { cursor: 'default' } : {}),
        }}
      >
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 16,
          paddingVertical: 14,
          borderBottomWidth: 1,
          borderBottomColor: C.border,
          backgroundColor: C.bg,
        }}>
          <Text style={{ ...T.fieldLabel, flex: 1, paddingRight: 12 }} numberOfLines={2}>
            {title}
          </Text>
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel={closeA11y}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={({ pressed, hovered }) => ({
              width: 36,
              height: 36,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: R.input,
              backgroundColor: pressed ? C.overlayPressed : hovered ? C.overlayHover : 'transparent',
              ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
            })}
          >
            <Text style={{ fontSize: 22, lineHeight: 24, color: C.muted }}>×</Text>
          </Pressable>
        </View>
        <View style={{ flex: 1 }}>
          {children}
        </View>
      </View>
    </View>
  );
}
