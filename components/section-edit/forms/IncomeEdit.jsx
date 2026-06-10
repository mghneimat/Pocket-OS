import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { useI18n } from '../../../lib/i18n';
import { getData } from '../../../lib/storage';
import { SECTION_STORAGE_KEYS, parseAmount, amountToString } from '../../../lib/sectionEditStorage';
import {
  GOAL_TYPES,
  SAVE_MODES,
  buildIncomeGoalPayload,
  goalTypeIncludesSaving,
  restoreGoalSelection,
} from '../../../lib/incomeGoals';
import { C, T } from '../../../constants/onboarding-theme';
import SectionEditForm from '../SectionEditForm';
import AmountFrequencyFields from '../AmountFrequencyFields';
import LabeledInput from '../../onboarding/LabeledInput';
import InputGroup from '../../onboarding/InputGroup';
import OptionCard from '../../onboarding/OptionCard';
import DatePicker from '../../onboarding/DatePicker';

function toEditState(saved) {
  const s = saved || {};
  const restoredGoal = restoreGoalSelection(s);
  return {
    amount: amountToString(s.amount),
    frequency: s.frequency || 'monthly',
    partnerAmount: amountToString(s.partnerAmount),
    partnerFrequency: s.partnerFrequency || 'monthly',
    savingsBalance: amountToString(s.savingsBalance),
    savingsMonthlyTarget: amountToString(s.savingsMonthlyTarget),
    goalType: restoredGoal.goalType,
    saveMode: restoredGoal.saveMode,
    goalDescription: s.goalDescription || '',
    goalAmount: amountToString(s.goalAmount),
    goalDate: s.goalDate || '',
    otherIncomeRows: (s.otherIncomeRows || []).map((r, i) => ({
      id: i,
      amount: amountToString(r.amount),
      frequency: r.frequency || 'monthly',
      label: r.label || '',
    })),
    hasOtherIncome: s.hasOtherIncome === true,
  };
}

function toPayload(draft) {
  return {
    amount: parseAmount(draft.amount),
    frequency: draft.frequency,
    partnerAmount: parseAmount(draft.partnerAmount),
    partnerFrequency: draft.partnerFrequency,
    hasOtherIncome: draft.hasOtherIncome,
    otherIncomeRows: draft.hasOtherIncome
      ? draft.otherIncomeRows.map((r) => ({
        amount: parseAmount(r.amount),
        frequency: r.frequency,
        label: r.label || null,
      }))
      : [],
    ...buildIncomeGoalPayload({
      goalType: draft.goalType,
      saveMode: draft.saveMode,
      savingsBalance: draft.savingsBalance,
      savingsMonthlyTarget: draft.savingsMonthlyTarget,
      goalDescription: draft.goalDescription,
      goalAmount: draft.goalAmount,
      goalDate: draft.goalDate,
    }),
  };
}

export default function IncomeEdit() {
  const { t } = useI18n();
  const [hasPartner, setHasPartner] = useState(false);

  useEffect(() => {
    getData('pocketos_household').then((h) => {
      setHasPartner(h?.type === 'partner' || h?.type === 'single_parent');
    });
  }, []);

  return (
    <SectionEditForm
      storageKey={SECTION_STORAGE_KEYS.income}
      initialData={toEditState(null)}
      loadTransform={(saved) => toEditState(saved)}
      transformBeforeSave={(draft) => toPayload(draft)}
      validate={(draft, tr) => {
        if (!parseAmount(draft.amount)) return tr('sectionEdit.income.validation.amount');
        if (goalTypeIncludesSaving(draft.goalType)) {
          if (!draft.saveMode) return tr('sectionEdit.income.validation.saveMode');
          if (draft.saveMode === SAVE_MODES.TARGET && !parseAmount(draft.goalAmount)) {
            return tr('sectionEdit.income.validation.goal');
          }
          if (draft.saveMode === SAVE_MODES.ONGOING && !parseAmount(draft.savingsMonthlyTarget)) {
            return tr('sectionEdit.income.validation.ongoing');
          }
        }
        return null;
      }}
    >
      {({ data, setData, currency }) => {
        if (!data) return null;
        const update = (patch) => setData((prev) => ({ ...prev, ...patch }));
        const includesSaving = goalTypeIncludesSaving(data.goalType);

        return (
          <View>
            <Text style={{ ...T.helper, color: C.muted, marginBottom: 16 }}>
              {t('sectionEdit.income.helper')}
            </Text>

            <AmountFrequencyFields
              label={t('sectionEdit.income.yourIncome')}
              amount={data.amount}
              frequency={data.frequency}
              onAmountChange={(v) => update({ amount: v })}
              onFrequencyChange={(v) => update({ frequency: v })}
              currency={currency}
              frequencyOptions={['weekly', 'fortnightly', 'monthly', 'annual']}
            />

            {hasPartner ? (
              <AmountFrequencyFields
                label={t('sectionEdit.income.partnerIncome')}
                amount={data.partnerAmount}
                frequency={data.partnerFrequency}
                onAmountChange={(v) => update({ partnerAmount: v })}
                onFrequencyChange={(v) => update({ partnerFrequency: v })}
                currency={currency}
                frequencyOptions={['weekly', 'fortnightly', 'monthly', 'annual']}
              />
            ) : null}

            <InputGroup label={t('sectionEdit.income.savingsBalance')}>
              <LabeledInput
                value={data.savingsBalance}
                onChangeText={(v) => update({ savingsBalance: v })}
                numeric
                large
                inGroup
                currency={currency}
              />
            </InputGroup>

            <Text style={{ ...T.fieldLabel, marginBottom: 8 }}>{t('sectionEdit.income.goalType')}</Text>
            <OptionCard
              label={t('onboarding.income.q5d.typeReduceCosts')}
              selected={data.goalType === GOAL_TYPES.REDUCE_COSTS}
              onPress={() => update({ goalType: GOAL_TYPES.REDUCE_COSTS, saveMode: null })}
            />
            <OptionCard
              label={t('onboarding.income.q5d.typeSaveMoney')}
              selected={data.goalType === GOAL_TYPES.SAVE_MONEY}
              onPress={() => update({ goalType: GOAL_TYPES.SAVE_MONEY })}
            />
            <OptionCard
              label={t('onboarding.income.q5d.typeReduceAndSave')}
              selected={data.goalType === GOAL_TYPES.REDUCE_AND_SAVE}
              onPress={() => update({ goalType: GOAL_TYPES.REDUCE_AND_SAVE })}
            />

            {includesSaving ? (
              <View style={{ marginTop: 8 }}>
                <Text style={{ ...T.fieldLabel, marginBottom: 8 }}>{t('sectionEdit.income.saveMode')}</Text>
                <OptionCard
                  label={t('onboarding.income.q5d.saveModeTarget')}
                  selected={data.saveMode === SAVE_MODES.TARGET}
                  onPress={() => update({ saveMode: SAVE_MODES.TARGET })}
                />
                <OptionCard
                  label={t('onboarding.income.q5d.saveModeOngoing')}
                  selected={data.saveMode === SAVE_MODES.ONGOING}
                  onPress={() => update({ saveMode: SAVE_MODES.ONGOING })}
                />

                {data.saveMode === SAVE_MODES.TARGET ? (
                  <View>
                    <LabeledInput
                      label={t('sectionEdit.income.goalDescription')}
                      value={data.goalDescription}
                      onChangeText={(v) => update({ goalDescription: v })}
                    />
                    <InputGroup label={t('sectionEdit.income.goalAmount')}>
                      <LabeledInput
                        value={data.goalAmount}
                        onChangeText={(v) => update({ goalAmount: v })}
                        numeric
                        large
                        inGroup
                        currency={currency}
                      />
                    </InputGroup>
                    <Text style={{ ...T.fieldLabel, marginBottom: 8 }}>{t('sectionEdit.income.goalDate')}</Text>
                    <DatePicker
                      value={data.goalDate}
                      onChange={(v) => update({ goalDate: v })}
                    />
                  </View>
                ) : null}

                {data.saveMode === SAVE_MODES.ONGOING ? (
                  <InputGroup label={t('sectionEdit.income.savingsMonthly')}>
                    <LabeledInput
                      value={data.savingsMonthlyTarget}
                      onChangeText={(v) => update({ savingsMonthlyTarget: v })}
                      numeric
                      large
                      inGroup
                      currency={currency}
                    />
                  </InputGroup>
                ) : null}
              </View>
            ) : null}
          </View>
        );
      }}
    </SectionEditForm>
  );
}
