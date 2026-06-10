import { View } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { useI18n } from '../../../lib/i18n';
import { SECTION_STORAGE_KEYS, parseAmount, amountToString } from '../../../lib/sectionEditStorage';
import { C, T } from '../../../constants/onboarding-theme';
import SectionEditForm from '../SectionEditForm';
import AmountFrequencyFields from '../AmountFrequencyFields';
import LabeledInput from '../../onboarding/LabeledInput';

function toEditState(saved) {
  return (saved || []).map((p, i) => ({
    id: p.id || `pet_${i}`,
    type: p.type || '',
    name: p.name || '',
    foodAmount: amountToString(p.foodAmount),
    foodFrequency: p.foodFrequency || 'monthly',
    vetAmount: amountToString(p.vetAmount),
    vetFrequency: p.vetFrequency || 'monthly',
  }));
}

function toPayload(rows) {
  return rows.map((p) => ({
    type: p.type,
    name: p.name,
    foodAmount: parseAmount(p.foodAmount),
    foodFrequency: p.foodFrequency,
    vetAmount: parseAmount(p.vetAmount),
    vetFrequency: p.vetFrequency,
  }));
}

export default function PetsEdit() {
  const { t } = useI18n();

  return (
    <SectionEditForm
      storageKey={SECTION_STORAGE_KEYS.pets}
      initialData={[]}
      loadTransform={(saved) => toEditState(saved)}
      transformBeforeSave={toPayload}
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

        return (
          <View>
            <Text style={{ ...T.helper, color: C.muted, marginBottom: 16 }}>
              {t('sectionEdit.pets.helper')}
            </Text>

            {rows.length === 0 ? (
              <Text style={{ ...T.helper }}>{t('sectionEdit.pets.empty')}</Text>
            ) : null}

            {rows.map((pet, idx) => (
              <View
                key={pet.id || idx}
                style={{
                  marginBottom: 16,
                  padding: 16,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: C.border,
                  backgroundColor: C.surface,
                }}
              >
                <Text style={{ fontSize: 15, fontWeight: '600', color: C.primary, marginBottom: 12 }}>
                  {pet.name || t('sectionEdit.pets.unnamed', { n: idx + 1 })}
                </Text>
                <LabeledInput
                  label={t('sectionEdit.pets.name')}
                  value={pet.name}
                  onChangeText={(v) => updateRow(idx, { name: v })}
                />
                <AmountFrequencyFields
                  label={t('sectionEdit.pets.food')}
                  amount={pet.foodAmount}
                  frequency={pet.foodFrequency}
                  onAmountChange={(v) => updateRow(idx, { foodAmount: v })}
                  onFrequencyChange={(v) => updateRow(idx, { foodFrequency: v })}
                  currency={currency}
                />
                <AmountFrequencyFields
                  label={t('sectionEdit.pets.vet')}
                  amount={pet.vetAmount}
                  frequency={pet.vetFrequency}
                  onAmountChange={(v) => updateRow(idx, { vetAmount: v })}
                  onFrequencyChange={(v) => updateRow(idx, { vetFrequency: v })}
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
