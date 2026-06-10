import { View } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { useI18n } from '../../../lib/i18n';
import { SECTION_STORAGE_KEYS, parseAmount, amountToString } from '../../../lib/sectionEditStorage';
import { C, T } from '../../../constants/onboarding-theme';
import SectionEditForm from '../SectionEditForm';
import AmountFrequencyFields from '../AmountFrequencyFields';
import LabeledInput from '../../onboarding/LabeledInput';
import InputGroup from '../../onboarding/InputGroup';

function toDraft(saved) {
  const s = saved || {};
  return {
    _original: saved,
    hasPublicTransport: s.hasPublicTransport === true,
    ptAmount: amountToString(s.ptAmount),
    ptFrequency: s.ptFrequency || 'monthly',
    vehicles: (s.vehicles || []).map((v, i) => ({
      id: v.id || `vehicle_${i}`,
      category: v.category || '',
      fuelCost: amountToString(v.fuelCost),
      insurancePremium: amountToString(v.insurancePremium),
      insuranceFrequency: v.insuranceFrequency || 'annual',
      parkingAmount: amountToString(v.parkingAmount),
      parkingFrequency: v.parkingFrequency || 'monthly',
    })),
    hasVehicle: s.hasVehicle !== false && (s.vehicles || []).length > 0,
  };
}

function toPayload(draft) {
  const orig = draft._original || {};
  const vehicles = (draft.vehicles || []).map((v, i) => {
    const origV = orig.vehicles?.[i] || {};
    return {
      ...origV,
      category: v.category || origV.category,
      fuelCost: parseAmount(v.fuelCost),
      insurancePremium: parseAmount(v.insurancePremium),
      insuranceFrequency: v.insuranceFrequency,
      parkingAmount: parseAmount(v.parkingAmount),
      parkingFrequency: v.parkingFrequency,
      hasInsurance: parseAmount(v.insurancePremium) > 0 || origV.hasInsurance,
      hasParking: parseAmount(v.parkingAmount) > 0 || origV.hasParking,
    };
  });

  return {
    ...orig,
    hasVehicle: draft.hasVehicle,
    vehicles,
    hasPublicTransport: draft.hasPublicTransport,
    ptAmount: draft.hasPublicTransport ? parseAmount(draft.ptAmount) : null,
    ptFrequency: draft.hasPublicTransport ? draft.ptFrequency : null,
    fuelCost: vehicles[0] ? parseAmount(vehicles[0].fuelCost) : null,
    insurancePremium: vehicles[0] ? parseAmount(vehicles[0].insurancePremium) : null,
  };
}

export default function TransportEdit() {
  const { t } = useI18n();

  return (
    <SectionEditForm
      storageKey={SECTION_STORAGE_KEYS.transport}
      initialData={toDraft(null)}
      loadTransform={(saved) => toDraft(saved)}
      transformBeforeSave={toPayload}
    >
      {({ data, setData, currency }) => {
        if (!data) return null;
        const update = (patch) => setData((prev) => ({ ...prev, ...patch }));

        return (
          <View>
            <Text style={{ ...T.helper, color: C.muted, marginBottom: 16 }}>
              {t('sectionEdit.transport.helper')}
            </Text>

            {data.hasPublicTransport ? (
              <AmountFrequencyFields
                label={t('sectionEdit.transport.publicTransport')}
                amount={data.ptAmount}
                frequency={data.ptFrequency}
                onAmountChange={(v) => update({ ptAmount: v })}
                onFrequencyChange={(v) => update({ ptFrequency: v })}
                currency={currency}
              />
            ) : null}

            {(data.vehicles || []).map((vehicle, idx) => (
              <View
                key={vehicle.id}
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
                  {t('sectionEdit.transport.vehicle', { n: idx + 1 })}
                </Text>
                <InputGroup label={t('sectionEdit.transport.fuel')}>
                  <LabeledInput
                    value={vehicle.fuelCost}
                    onChangeText={(v) => {
                      const vehicles = [...data.vehicles];
                      vehicles[idx] = { ...vehicles[idx], fuelCost: v };
                      update({ vehicles });
                    }}
                    numeric
                    large
                    inGroup
                    currency={currency}
                  />
                </InputGroup>
                <AmountFrequencyFields
                  label={t('sectionEdit.transport.insurance')}
                  amount={vehicle.insurancePremium}
                  frequency={vehicle.insuranceFrequency}
                  onAmountChange={(v) => {
                    const vehicles = [...data.vehicles];
                    vehicles[idx] = { ...vehicles[idx], insurancePremium: v };
                    update({ vehicles });
                  }}
                  onFrequencyChange={(v) => {
                    const vehicles = [...data.vehicles];
                    vehicles[idx] = { ...vehicles[idx], insuranceFrequency: v };
                    update({ vehicles });
                  }}
                  currency={currency}
                />
                <AmountFrequencyFields
                  label={t('sectionEdit.transport.parking')}
                  amount={vehicle.parkingAmount}
                  frequency={vehicle.parkingFrequency}
                  onAmountChange={(v) => {
                    const vehicles = [...data.vehicles];
                    vehicles[idx] = { ...vehicles[idx], parkingAmount: v };
                    update({ vehicles });
                  }}
                  onFrequencyChange={(v) => {
                    const vehicles = [...data.vehicles];
                    vehicles[idx] = { ...vehicles[idx], parkingFrequency: v };
                    update({ vehicles });
                  }}
                  currency={currency}
                />
              </View>
            ))}

            {!data.hasPublicTransport && (data.vehicles || []).length === 0 ? (
              <Text style={{ ...T.helper }}>{t('sectionEdit.transport.empty')}</Text>
            ) : null}
          </View>
        );
      }}
    </SectionEditForm>
  );
}
