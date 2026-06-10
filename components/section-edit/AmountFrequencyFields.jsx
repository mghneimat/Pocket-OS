import { View } from 'react-native';
import LabeledInput from '../onboarding/LabeledInput';
import FrequencyPills from '../onboarding/FrequencyPills';
import InputGroup from '../onboarding/InputGroup';

export default function AmountFrequencyFields({
  label,
  amount,
  frequency,
  onAmountChange,
  onFrequencyChange,
  currency,
  frequencyOptions = ['monthly', 'quarterly', 'annual'],
  amountPlaceholder,
}) {
  return (
    <View style={{ marginBottom: 16 }}>
      {label ? (
        <InputGroup label={label}>
          <LabeledInput
            value={amount}
            onChangeText={onAmountChange}
            numeric
            large
            inGroup
            currency={currency}
            placeholder={amountPlaceholder}
          />
        </InputGroup>
      ) : (
        <LabeledInput
          value={amount}
          onChangeText={onAmountChange}
          numeric
          large
          currency={currency}
          placeholder={amountPlaceholder}
        />
      )}
      <FrequencyPills
        options={frequencyOptions}
        value={frequency || 'monthly'}
        onChange={onFrequencyChange}
        small
        containerStyle={{ marginBottom: 0 }}
      />
    </View>
  );
}
