import { View, Text } from 'react-native';
import { formatCurrency } from '../../lib/finance';
import { C, tabularNums } from '../../constants/onboarding-theme';

/**
 * Amount + currency cell for the budget summary table.
 * Stacks below the label on narrow viewports.
 */
export default function BudgetAmountCell({
  amount,
  currency,
  layout,
  fontSize = 14,
  fontWeight = '600',
  color,
  paddingVertical = 12,
}) {
  const textColor = color ?? C.text;
  const formatted = amount >= 0
    ? formatCurrency(amount, '')
    : `-${formatCurrency(Math.abs(amount), '')}`;

  if (layout.stackAmount) {
    return (
      <View style={{
        paddingHorizontal: 16,
        paddingBottom: paddingVertical,
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        gap: 4,
      }}>
        <Text style={{ fontSize, fontWeight, color: textColor, ...tabularNums }} numberOfLines={1}>
          {formatted}
        </Text>
        <Text style={{ fontSize: 10, fontWeight: '400', color: C.placeholder }}>{currency}</Text>
      </View>
    );
  }

  return (
    <View style={{
      width: layout.amountColumnWidth,
      paddingVertical,
      paddingRight: layout.isCompact ? 10 : 16,
      flexDirection: 'row',
      alignItems: 'center',
      minWidth: 0,
    }}>
      <View style={{ flex: 1, alignItems: 'center', minWidth: 0 }}>
        <Text
          style={{ fontSize: layout.isCompact ? fontSize - 1 : fontSize, fontWeight, color: textColor, ...tabularNums }}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.85}
        >
          {formatted}
        </Text>
      </View>
      <Text style={{
        fontSize: layout.isCompact ? 10 : 11,
        fontWeight: '400',
        color: C.placeholder,
        marginLeft: 2,
      }}>
        {currency}
      </Text>
    </View>
  );
}
