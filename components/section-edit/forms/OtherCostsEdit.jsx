import { View } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { useI18n } from '../../../lib/i18n';
import { SECTION_STORAGE_KEYS, parseAmount, amountToString } from '../../../lib/sectionEditStorage';
import { C, T } from '../../../constants/onboarding-theme';
import SectionEditForm from '../SectionEditForm';
import AmountFrequencyFields from '../AmountFrequencyFields';
import RemoveButton from '../../onboarding/RemoveButton';

function costLabel(t, name) {
  const key = `onboarding.otherCosts.q12.costs.${name}`;
  const translated = t(key);
  return translated !== key ? translated : (name || t('sectionEdit.otherCosts.unnamed'));
}

function toEditState(saved) {
  return (saved || []).map((c, i) => ({
    id: `cost_${i}`,
    name: c.name || '',
    amount: amountToString(c.amount),
    frequency: c.frequency || 'monthly',
    dueDate: c.dueDate || '',
  }));
}

function toPayload(rows) {
  return rows.map((c) => ({
    name: c.name,
    amount: parseAmount(c.amount),
    frequency: c.frequency,
    dueDate: c.dueDate || null,
  }));
}

export default function OtherCostsEdit() {
  const { t } = useI18n();

  return (
    <SectionEditForm
      storageKey={SECTION_STORAGE_KEYS['other-costs']}
      initialData={[]}
      loadTransform={(saved) => toEditState(saved)}
      transformBeforeSave={toPayload}
      validate={(rows, tr) => {
        for (let i = 0; i < rows.length; i++) {
          if (!parseAmount(rows[i].amount)) return tr('sectionEdit.otherCosts.validation');
        }
        return null;
      }}
    >
      {({ data, setData, currency }) => {
        const rows = data || [];
        const updateRow = (idx, patch) => {
          setData((prev) => {
            const next = [...(prev || [])];
            next[idx] = { ...next[idx], ...patch };
            return next;
          });
        };
        const removeRow = (idx) => setData((prev) => (prev || []).filter((_, i) => i !== idx));

        return (
          <View>
            <Text style={{ ...T.helper, color: C.muted, marginBottom: 16 }}>
              {t('sectionEdit.otherCosts.helper')}
            </Text>

            {rows.length === 0 ? (
              <Text style={{ ...T.helper }}>{t('sectionEdit.otherCosts.empty')}</Text>
            ) : null}

            {rows.map((cost, idx) => (
              <View
                key={cost.id}
                style={{
                  marginBottom: 16,
                  padding: 16,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: C.border,
                  backgroundColor: C.surface,
                }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                  <Text style={{ fontSize: 15, fontWeight: '600', color: C.primary }}>
                    {costLabel(t, cost.name)}
                  </Text>
                  <RemoveButton onPress={() => removeRow(idx)} />
                </View>
                <AmountFrequencyFields
                  amount={cost.amount}
                  frequency={cost.frequency}
                  onAmountChange={(v) => updateRow(idx, { amount: v })}
                  onFrequencyChange={(v) => updateRow(idx, { frequency: v })}
                  currency={currency}
                />
              </View>
            ))}
          </View>
        );
      }}
    </SectionEditForm>
  );
}
