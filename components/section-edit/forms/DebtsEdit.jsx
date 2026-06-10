import { View, Pressable } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { useI18n } from '../../../lib/i18n';
import { SECTION_STORAGE_KEYS, parseAmount, amountToString } from '../../../lib/sectionEditStorage';
import { C, T } from '../../../constants/onboarding-theme';
import SectionEditForm from '../SectionEditForm';
import LabeledInput from '../../onboarding/LabeledInput';
import InputGroup from '../../onboarding/InputGroup';
import RemoveButton from '../../onboarding/RemoveButton';

const DEBT_TYPES = ['creditCard', 'personalLoan', 'mortgage', 'carLoan', 'studentLoan', 'other'];

function toEditState(saved) {
  return (saved || []).map((d, i) => ({
    id: d.id || `debt_${i}`,
    type: d.type || null,
    balance: amountToString(d.balance),
    minPayment: amountToString(d.minPayment),
    apr: amountToString(d.apr),
    promoEndDate: d.promoEndDate || '',
    paymentDueDay: amountToString(d.paymentDueDay),
    notes: d.notes || '',
  }));
}

function toPayload(rows) {
  return rows.map((d) => ({
    id: d.id,
    type: d.type,
    balance: parseAmount(d.balance),
    minPayment: parseAmount(d.minPayment),
    apr: parseAmount(d.apr),
    promoEndDate: d.promoEndDate || null,
    paymentDueDay: parseAmount(d.paymentDueDay),
    notes: d.notes || null,
  }));
}

export default function DebtsEdit() {
  const { t } = useI18n();

  return (
    <SectionEditForm
      storageKey={SECTION_STORAGE_KEYS.debts}
      initialData={[]}
      loadTransform={(saved) => toEditState(saved)}
      transformBeforeSave={toPayload}
      validate={(rows, tr) => {
        for (let i = 0; i < rows.length; i++) {
          if (!parseAmount(rows[i].balance) || !parseAmount(rows[i].minPayment)) {
            return tr('sectionEdit.debts.validation');
          }
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
        const addRow = () => {
          setData((prev) => [
            ...(prev || []),
            {
              id: `debt_${Date.now()}`,
              type: 'other',
              balance: '',
              minPayment: '',
              apr: '',
              promoEndDate: '',
              paymentDueDay: '',
              notes: '',
            },
          ]);
        };
        const removeRow = (idx) => setData((prev) => (prev || []).filter((_, i) => i !== idx));

        return (
          <View>
            <Text style={{ ...T.helper, color: C.muted, marginBottom: 16 }}>
              {t('sectionEdit.debts.helper')}
            </Text>

            {rows.length === 0 ? (
              <Text style={{ ...T.helper, marginBottom: 16 }}>{t('sectionEdit.debts.empty')}</Text>
            ) : null}

            {rows.map((debt, idx) => (
              <View
                key={debt.id}
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
                    {t('sectionEdit.debts.itemLabel', { n: idx + 1 })}
                  </Text>
                  <RemoveButton onPress={() => removeRow(idx)} />
                </View>

                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                  {DEBT_TYPES.map((type) => (
                    <Pressable
                      key={type}
                      onPress={() => updateRow(idx, { type })}
                      style={{
                        paddingVertical: 8,
                        paddingHorizontal: 12,
                        borderRadius: 8,
                        backgroundColor: debt.type === type ? C.chipSelectedBg : C.bg,
                        borderWidth: 1,
                        borderColor: debt.type === type ? C.primary : C.border,
                      }}
                    >
                      <Text style={{ fontSize: 12, color: debt.type === type ? C.primary : C.muted }}>
                        {t(`onboarding.debts.q13a.${type}`)}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                <InputGroup label={t('onboarding.debts.q13a.balanceLabel')}>
                  <LabeledInput
                    value={debt.balance}
                    onChangeText={(v) => updateRow(idx, { balance: v })}
                    numeric
                    large
                    inGroup
                    currency={currency}
                  />
                </InputGroup>
                <InputGroup label={t('onboarding.debts.q13a.minPaymentLabel')}>
                  <LabeledInput
                    value={debt.minPayment}
                    onChangeText={(v) => updateRow(idx, { minPayment: v })}
                    numeric
                    large
                    inGroup
                    currency={currency}
                  />
                </InputGroup>
                <LabeledInput
                  label={t('onboarding.debts.q13a.aprLabel')}
                  value={debt.apr}
                  onChangeText={(v) => updateRow(idx, { apr: v })}
                  numeric
                />
              </View>
            ))}

            <Pressable
              onPress={addRow}
              accessibilityRole="button"
              style={{
                paddingVertical: 14,
                alignItems: 'center',
                borderRadius: 10,
                borderWidth: 1,
                borderStyle: 'dashed',
                borderColor: C.border,
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: '600', color: C.primary }}>
                {t('sectionEdit.debts.add')}
              </Text>
            </Pressable>
          </View>
        );
      }}
    </SectionEditForm>
  );
}
