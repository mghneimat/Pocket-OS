import { View, Modal, Pressable, Platform } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { C, R, S } from '../../constants/onboarding-theme';

/**
 * Cross-platform confirm dialog — Alert.alert is unreliable on web.
 */
export default function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel,
  destructive = false,
  onConfirm,
  onCancel,
}) {
  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
      statusBarTranslucent
    >
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          padding: S.pagePadH,
        }}
      >
        <Pressable
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(30,58,95,0.35)',
          }}
          onPress={onCancel}
          accessibilityRole="button"
          accessibilityLabel={cancelLabel}
        />
        <View
          style={{
            width: '100%',
            maxWidth: 400,
            backgroundColor: C.surface,
            borderRadius: R.card,
            borderWidth: 1,
            borderColor: C.border,
            padding: 20,
            ...(Platform.OS === 'web' ? { cursor: 'default' } : {}),
          }}
        >
          <Text style={{ fontSize: 17, fontWeight: '600', color: C.primary, marginBottom: 8 }}>
            {title}
          </Text>
          <Text style={{ fontSize: 15, lineHeight: 22, color: C.muted, marginBottom: 20 }}>
            {message}
          </Text>
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 10 }}>
            <Pressable
              onPress={onCancel}
              accessibilityRole="button"
              accessibilityLabel={cancelLabel}
              style={({ pressed }) => ({
                minHeight: 44,
                paddingHorizontal: 16,
                borderRadius: R.button,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: pressed ? C.overlayPressed : C.bg,
                borderWidth: 1,
                borderColor: C.border,
                ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
              })}
            >
              <Text style={{ fontSize: 15, fontWeight: '500', color: C.text }}>{cancelLabel}</Text>
            </Pressable>
            <Pressable
              onPress={onConfirm}
              accessibilityRole="button"
              accessibilityLabel={confirmLabel}
              style={({ pressed }) => ({
                minHeight: 44,
                paddingHorizontal: 16,
                borderRadius: R.button,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: destructive
                  ? pressed ? '#DC2626' : C.danger
                  : pressed ? C.primaryPressed : C.primary,
                ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
              })}
            >
              <Text style={{ fontSize: 15, fontWeight: '600', color: C.pillSelectedText }}>
                {confirmLabel}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
