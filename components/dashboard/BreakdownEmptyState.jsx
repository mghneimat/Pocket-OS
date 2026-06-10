import { View } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { C, R, T } from '../../constants/onboarding-theme';
import PrimaryButton from '../ui/PrimaryButton';
import { OutlineButton } from '../ui/OutlineButton';

/**
 * Empty breakdown panel with optional primary/secondary actions.
 */
export default function BreakdownEmptyState({
  message,
  hint,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondary,
}) {
  return (
    <View style={{
      marginTop: 24,
      padding: 20,
      borderRadius: R.card,
      borderWidth: 1,
      borderColor: C.border,
      backgroundColor: C.surface,
      alignItems: 'center',
      gap: 12,
    }}>
      <Text style={{ ...T.body, color: C.muted, textAlign: 'center' }}>{message}</Text>
      {hint ? (
        <Text style={{ ...T.helper, color: C.muted, textAlign: 'center' }}>{hint}</Text>
      ) : null}
      {actionLabel && onAction ? (
        <PrimaryButton onPress={onAction} fullWidth={false} style={{ alignSelf: 'stretch' }}>
          {actionLabel}
        </PrimaryButton>
      ) : null}
      {secondaryLabel && onSecondary ? (
        <OutlineButton onPress={onSecondary} style={{ alignSelf: 'stretch' }}>
          {secondaryLabel}
        </OutlineButton>
      ) : null}
    </View>
  );
}
