import { useState, useEffect, useCallback } from 'react';
import { View } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { useI18n } from '../../lib/i18n';
import { formatCurrency, toMonthly } from '../../lib/finance';
import { amountToString } from '../../lib/sectionEditStorage';
import { C, R, T, tabularNums } from '../../constants/onboarding-theme';
import AmountFrequencyFields from '../section-edit/AmountFrequencyFields';
import LabeledInput from '../onboarding/LabeledInput';
import PrimaryButton from '../ui/PrimaryButton';

export default function IncomeStreamCard({
  title,
  amount,
  frequency,
  currency,
  onSave,
  showLabelField = false,
  label = '',
  onLabelChange,
  frequencyOptions = ['weekly', 'fortnightly', 'monthly', 'annual'],
}) {
  const { t } = useI18n();
  const [draftAmount, setDraftAmount] = useState(amountToString(amount));
  const [draftFreq, setDraftFreq] = useState(frequency || 'monthly');
  const [draftLabel, setDraftLabel] = useState(label || '');
  const [expanded, setExpanded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => {
    setDraftAmount(amountToString(amount));
    setDraftFreq(frequency || 'monthly');
    setDraftLabel(label || '');
  }, [amount, frequency, label]);

  const monthly = toMonthly(parseFloat(draftAmount) || amount || 0, draftFreq);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await onSave({
        amount: draftAmount,
        frequency: draftFreq,
        ...(showLabelField ? { label: draftLabel } : {}),
      });
      setExpanded(false);
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 2000);
    } finally {
      setSaving(false);
    }
  }, [draftAmount, draftFreq, draftLabel, onSave, showLabelField]);

  return (
    <View style={{
      marginBottom: 12,
      borderRadius: R.card,
      borderWidth: 1,
      borderColor: C.border,
      backgroundColor: C.surface,
      overflow: 'hidden',
    }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 14,
          gap: 12,
        }}
      >
        <View style={{ flex: 1 }}>
          <Text style={{ ...T.fieldLabel }} numberOfLines={2}>{title}</Text>
          {showLabelField && label ? (
            <Text style={{ ...T.caption, color: C.muted, marginTop: 2 }} numberOfLines={1}>{label}</Text>
          ) : null}
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: C.primary, ...tabularNums }}>
            {formatCurrency(toMonthly(amount || 0, frequency || 'monthly'), currency)}
          </Text>
          <Text style={{ ...T.caption, color: C.muted, marginTop: 2 }}>
            {t('dashboard.home.kpi.perMonth')}
          </Text>
        </View>
        <PrimaryButton
          onPress={() => setExpanded((v) => !v)}
          fullWidth={false}
          style={{ paddingHorizontal: 12, paddingVertical: 8, minHeight: 36 }}
        >
          {expanded ? t('common.cancel') : t('dashboard.summaryScreen.edit')}
        </PrimaryButton>
      </View>

      {savedFlash ? (
        <Text style={{ ...T.caption, color: C.positive, paddingHorizontal: 16, paddingBottom: 10 }}>
          {t('dashboard.incomeScreen.saved')}
        </Text>
      ) : null}

      {expanded ? (
        <View style={{
          paddingHorizontal: 16,
          paddingBottom: 16,
          borderTopWidth: 1,
          borderTopColor: C.divider,
          paddingTop: 14,
        }}>
          {showLabelField ? (
            <LabeledInput
              label={t('dashboard.incomeScreen.sourceLabel')}
              value={draftLabel}
              onChangeText={(v) => {
                setDraftLabel(v);
                onLabelChange?.(v);
              }}
            />
          ) : null}
          <AmountFrequencyFields
            amount={draftAmount}
            frequency={draftFreq}
            onAmountChange={setDraftAmount}
            onFrequencyChange={setDraftFreq}
            currency={currency}
            frequencyOptions={frequencyOptions}
          />
          <Text style={{ ...T.caption, color: C.muted, marginBottom: 12 }}>
            {t('dashboard.incomeScreen.monthlyEquivalent', {
              amount: formatCurrency(monthly, currency),
            })}
          </Text>
          <PrimaryButton onPress={handleSave} disabled={saving}>
            {t('dashboard.incomeScreen.saveStream')}
          </PrimaryButton>
        </View>
      ) : null}
    </View>
  );
}
