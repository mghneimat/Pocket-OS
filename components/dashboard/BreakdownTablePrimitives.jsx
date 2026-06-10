import { View } from 'react-native';

export function BreakdownCell({ children, width, flex, align = 'left', narrow = false }) {
  return (
    <View style={{
      ...(width != null ? { width, flexShrink: narrow ? 1 : 0 } : { flex, minWidth: 0 }),
      alignItems: align === 'right' ? 'flex-end' : align === 'center' ? 'center' : 'flex-start',
      justifyContent: 'center',
    }}>
      {children}
    </View>
  );
}

export function BreakdownRow({ children, style, tableMaxW }) {
  return (
    <View style={[{
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      width: '100%',
      ...(tableMaxW != null ? { maxWidth: tableMaxW, alignSelf: 'center' } : {}),
    }, style]}>
      {children}
    </View>
  );
}
