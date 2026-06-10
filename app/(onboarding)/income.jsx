import { useState, useEffect, useRef } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useI18n } from '../../lib/i18n';
import { getData, setData } from '../../lib/storage';
import { getCurrencySymbol } from '../../lib/currency';
import { toMonthly, formatCurrency } from '../../lib/finance';
import { C, S, T, R } from '../../constants/onboarding-theme';
import QuestionScreen from '../../components/onboarding/QuestionScreen';
import OptionCard from '../../components/onboarding/OptionCard';
import PillToggle from '../../components/onboarding/PillToggle';
import DatePicker from '../../components/onboarding/DatePicker';
import AnimatedSlideIn from '../../components/onboarding/AnimatedSlideIn';
import AnimatedRow from '../../components/onboarding/AnimatedRow';
import RemoveButton from '../../components/onboarding/RemoveButton';
import LabeledInput from '../../components/onboarding/LabeledInput';
import YesNoToggle from '../../components/onboarding/YesNoToggle';
import FrequencyPills from '../../components/onboarding/FrequencyPills';
import AddAnotherButton from '../../components/onboarding/AddAnotherButton';
import InputGroup from '../../components/onboarding/InputGroup';
import ScrollFocusAnchor from '../../components/onboarding/ScrollFocusAnchor';
import { useSectionExit } from '../../lib/finishOnboardingSection';
import {
  getIncomeBackTarget,
  hasPriorSalaryIncome,
  resolveInitialIncomeStep,
  validateOtherIncomeContinue,
} from '../../lib/incomeFlow';
import {
  GOAL_TYPES,
  SAVE_MODES,
  buildIncomeGoalPayload,
  restoreGoalSelection,
} from '../../lib/incomeGoals';

const FREQUENCIES = ['daily', 'weekly', 'fortnightly', 'monthly'];

/**
 * Q5 — Your income (title adapts by occupation)
 * Q5a — Partner's income (partner branch only)
 * Q5b — Other income sources (toggle + repeating rows)
 * Q5c — Savings (balance + monthly target)
 * Q5d — Financial goal (toggle + description + amount + date)
 */
export default function IncomeScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const { isEditMode, completeSection, leaveSection, editContinueLabel } = useSectionExit();

  // ── Loaded data ──
  const [occupation, setOccupation] = useState(null);
  const [hasPartner, setHasPartner] = useState(false);
  const [partnerName, setPartnerName] = useState('');
  const [currencyCode, setCurrencyCode] = useState('CZK');
  const currency = getCurrencySymbol(currencyCode);

  // ── Step tracking ──
  const [step, setStep] = useState('q5'); // q5 | q5a | q5b | q5c | q5d | q5d-mode | q5d-details

  // ── Q5: Your income ──
  const [incomeAmount, setIncomeAmount] = useState('');
  const [incomeFrequency, setIncomeFrequency] = useState('monthly');

  // ── Q5a: Partner income ──
  const [partnerIncomeAmount, setPartnerIncomeAmount] = useState('');
  const [partnerIncomeFrequency, setPartnerIncomeFrequency] = useState('monthly');

  // ── Q5b: Other income ──
  const [hasOtherIncome, setHasOtherIncome] = useState(null); // null | true | false
  const [otherIncomeRows, setOtherIncomeRows] = useState([
    { id: 0, amount: '', frequency: 'monthly', label: '', visible: true },
  ]);
  const nextRowId = useRef(1);
  const [focusToken, setFocusToken] = useState(null);

  // ── Q5c: Savings ──
  const [savingsBalance, setSavingsBalance] = useState('');
  const [savingsMonthlyTarget, setSavingsMonthlyTarget] = useState('');

  // ── Q5d: Financial goal ──
  const [goalType, setGoalType] = useState(null); // reduceCosts | saveMoney | reduceAndSave
  const [saveMode, setSaveMode] = useState(null); // target | ongoing
  const [goalDescription, setGoalDescription] = useState('');
  const [goalAmount, setGoalAmount] = useState('');
  const [goalDate, setGoalDate] = useState('');

  // ── Validation ──
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    async function loadData() {
      const occ = await getData('pocketos_occupation');
      if (occ) setOccupation(occ);

      const loc = await getData('pocketos_location');
      if (loc?.currency) setCurrencyCode(loc.currency);

      const household = await getData('pocketos_household');
      const partnerHousehold = household?.type === 'partner' && household?.partnerName;
      if (partnerHousehold) {
        setHasPartner(true);
        setPartnerName(household.partnerName);
      }

      const saved = await getData('pocketos_income');
      if (saved) {
        if (saved.amount) setIncomeAmount(String(saved.amount));
        if (saved.frequency) setIncomeFrequency(saved.frequency);
        if (saved.partnerAmount) setPartnerIncomeAmount(String(saved.partnerAmount));
        if (saved.partnerFrequency) setPartnerIncomeFrequency(saved.partnerFrequency);
        if (saved.hasOtherIncome !== undefined) setHasOtherIncome(saved.hasOtherIncome);
        if (saved.otherIncomeRows) {
          // Restore rows with id and visible fields for animation support
          const restored = saved.otherIncomeRows.map((r, i) => ({
            id: i,
            amount: r.amount != null ? String(r.amount) : '',
            frequency: r.frequency || 'monthly',
            label: r.label || '',
            visible: true,
          }));
          setOtherIncomeRows(restored);
          nextRowId.current = restored.length;
        }
        if (saved.savingsBalance) setSavingsBalance(String(saved.savingsBalance));
        if (saved.savingsMonthlyTarget) setSavingsMonthlyTarget(String(saved.savingsMonthlyTarget));
        const restoredGoal = restoreGoalSelection(saved);
        if (restoredGoal.goalType) setGoalType(restoredGoal.goalType);
        if (restoredGoal.saveMode) setSaveMode(restoredGoal.saveMode);
        if (saved.goalDescription) setGoalDescription(saved.goalDescription);
        if (saved.goalAmount) setGoalAmount(String(saved.goalAmount));
        if (saved.goalDate) setGoalDate(saved.goalDate);
      }

      setStep(resolveInitialIncomeStep({
        isEditMode,
        hasPartner: Boolean(partnerHousehold),
        userOccupation: occ?.user,
        partnerOccupation: occ?.partner,
      }));
    }
    loadData();
  }, [isEditMode]);

  const occupationKey = occupation?.user || 'other';
  const isNotWorking = occupationKey === 'notWorking';
  const partnerOccKey = occupation?.partner;
  const partnerIsNotWorking = partnerOccKey === 'notWorking';

  const getTitleKey = (key) => {
    switch (key) {
      case 'employee': return 'titleEmployee';
      case 'selfEmployed': return 'titleSelfEmployed';
      case 'student': return 'titleStudent';
      case 'notWorking': return 'titleNotWorking';
      default: return 'titleOther';
    }
  };

  const getHelperKey = (key) => {
    switch (key) {
      case 'employee': return 'helperEmployee';
      case 'selfEmployed': return 'helperSelfEmployed';
      case 'student': return 'helperStudent';
      case 'notWorking': return 'helperNotWorking';
      default: return 'helperOther';
    }
  };

  const monthlyEquivalent = (amount, freq) => {
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) return null;
    const monthly = toMonthly(num, freq);
    return formatCurrency(monthly, currency);
  };

  const handleContinue = async () => {
    setValidationError('');

    if (isEditMode) {
      await saveAll();
      return;
    }

    if (step === 'q5') {
      if (!isNotWorking && !incomeAmount) {
        setValidationError(t('onboarding.income.q5.validation'));
        return;
      }
      if (hasPartner && !partnerIsNotWorking) {
        setStep('q5a');
      } else {
        setStep('q5b');
      }
    } else if (step === 'q5a') {
      if (!partnerIncomeAmount) {
        setValidationError(t('onboarding.income.q5a.validation', { name: partnerName }));
        return;
      }
      setStep('q5b');
    } else if (step === 'q5b') {
      const priorSalary = hasPriorSalaryIncome({
        isNotWorking,
        incomeAmount,
        hasPartner,
        partnerIsNotWorking,
        partnerIncomeAmount,
      });
      const validationKey = validateOtherIncomeContinue({
        hasPriorSalary: priorSalary,
        hasOtherIncome,
        otherIncomeRows,
      });
      if (validationKey) {
        const messageKey = validationKey === 'validationNoIncome' && !hasPartner
          ? 'onboarding.income.q5b.validationNoIncomeSolo'
          : `onboarding.income.q5b.${validationKey}`;
        setValidationError(t(messageKey, { name: partnerName }));
        return;
      }
      setStep('q5c');
    } else if (step === 'q5c') {
      setStep('q5d');
    } else if (step === 'q5d') {
      if (!goalType) {
        setValidationError(t('onboarding.income.q5d.validationType'));
        return;
      }
      if (goalType === GOAL_TYPES.REDUCE_COSTS) {
        await saveAll();
        return;
      }
      setStep('q5d-mode');
    } else if (step === 'q5d-mode') {
      if (!saveMode) {
        setValidationError(t('onboarding.income.q5d.validationSaveMode'));
        return;
      }
      setStep('q5d-details');
    } else if (step === 'q5d-details') {
      if (saveMode === SAVE_MODES.TARGET) {
        if (!goalAmount) {
          setValidationError(t('onboarding.income.q5d.validationTargetAmount'));
          return;
        }
        if (!goalDate) {
          setValidationError(t('onboarding.income.q5d.validationTargetDate'));
          return;
        }
      } else if (!savingsMonthlyTarget) {
        setValidationError(t('onboarding.income.q5d.validationOngoingAmount'));
        return;
      }
      await saveAll();
    }
  };

  const saveAll = async () => {
    const incomeData = {
      amount: incomeAmount ? parseFloat(incomeAmount) : null,
      frequency: incomeFrequency,
      partnerAmount: partnerIncomeAmount ? parseFloat(partnerIncomeAmount) : null,
      partnerFrequency: partnerIncomeFrequency,
      hasOtherIncome,
      otherIncomeRows: hasOtherIncome ? otherIncomeRows.map(r => ({
        amount: r.amount ? parseFloat(r.amount) : null,
        frequency: r.frequency,
        label: r.label,
      })) : [],
      ...buildIncomeGoalPayload({
        goalType,
        saveMode,
        savingsBalance,
        savingsMonthlyTarget,
        goalDescription,
        goalAmount,
        goalDate,
      }),
    };

    await completeSection({
      persist: async () => { await setData('pocketos_income', incomeData); },
      onboardingPatch: { completed: false, currentStep: 'income', percentComplete: 55 },
      nextRoute: '/(onboarding)/splash-housing',
    });
  };

  const handleBack = () => {
    setValidationError('');
    if (step === 'q5c') { setStep('q5b'); return; }
    if (step === 'q5d-details') { setStep('q5d-mode'); return; }
    if (step === 'q5d-mode') { setStep('q5d'); return; }
    if (step === 'q5d') { setStep('q5c'); return; }

    const backTarget = getIncomeBackTarget({
      step,
      hasPartner,
      isNotWorking,
      partnerIsNotWorking,
    });

    if (backTarget === 'splash') {
      leaveSection(() => router.replace('/(onboarding)/splash-income'));
      return;
    }
    setStep(backTarget);
  };

  const progressMap = {
    q5: 45,
    q5a: 48,
    q5b: 50,
    q5c: 53,
    q5d: 54,
    'q5d-mode': 55,
    'q5d-details': 56,
  };
  const progress = progressMap[step] || 45;
  const screenProgress = isEditMode ? undefined : progress;

  const addOtherRow = () => {
    const id = nextRowId.current++;
    setOtherIncomeRows([...otherIncomeRows, { id, amount: '', frequency: 'monthly', label: '', visible: true }]);
    setFocusToken(String(id));
  };

  const updateOtherRow = (index, field, value) => {
    const rows = [...otherIncomeRows];
    rows[index] = { ...rows[index], [field]: value };
    setOtherIncomeRows(rows);
  };

  const removeOtherRow = (id) => {
    if (otherIncomeRows.length <= 1) return;
    // Mark row as invisible to trigger exit animation
    setOtherIncomeRows(otherIncomeRows.map(r =>
      r.id === id ? { ...r, visible: false } : r
    ));
  };

  const finalizeRemove = (id) => {
    setOtherIncomeRows((prev) => prev.filter(r => r.id !== id));
  };

  // ── Q5: Your income ──
  if (step === 'q5') {
    return (
      <QuestionScreen
        animationKey={step}
        chapter={t('onboarding.income.chapter')}
        title={isNotWorking
          ? t('onboarding.income.q5.titleNotWorking')
          : t(`onboarding.income.q5.${getTitleKey(occupationKey)}`)}
        helper={t(`onboarding.income.q5.${getHelperKey(occupationKey)}`)}
        onContinue={handleContinue}
        onBack={handleBack}
        validationError={validationError}
        progress={screenProgress}
        continueLabel={editContinueLabel}
      >
        {isNotWorking ? (
          <View style={{
            padding: 16,
            backgroundColor: C.infoBg,
            borderRadius: R.input,
            borderWidth: 1,
            borderColor: C.infoBorder,
          }}>
            <Text style={{ fontSize: 14, color: C.infoText, lineHeight: 22 }}>
              {t('onboarding.income.q5.notWorkingNote')}
            </Text>
          </View>
        ) : (
          <>
            <InputGroup label={t(`onboarding.income.q5.${getTitleKey(occupationKey)}`)}>
              <LabeledInput
                value={incomeAmount}
                onChangeText={setIncomeAmount}
                numeric
                placeholder="0"
                large
                inGroup
                currency={currency}
              />
              <FrequencyPills
                options={FREQUENCIES}
                value={incomeFrequency}
                onChange={setIncomeFrequency}
                labelMap={{
                  daily: t('onboarding.income.q5.frequencyDaily'),
                  weekly: t('onboarding.income.q5.frequencyWeekly'),
                  fortnightly: t('onboarding.income.q5.frequencyFortnightly'),
                  monthly: t('onboarding.income.q5.frequencyMonthly'),
                }}
              />
            </InputGroup>
          </>
        )}
      </QuestionScreen>
    );
  }

  // ── Q5a: Partner income ──
  if (step === 'q5a') {
    return (
      <QuestionScreen
        animationKey={step}
        chapter={t('onboarding.income.chapter')}
        title={t('onboarding.income.q5a.title', { name: partnerName })}
        helper={t('onboarding.income.q5a.helper')}
        onContinue={handleContinue}
        onBack={handleBack}
        validationError={validationError}
        progress={screenProgress}
        continueLabel={editContinueLabel}
      >
        <InputGroup label={t('onboarding.income.q5a.amountLabel')}>
          <LabeledInput
            value={partnerIncomeAmount}
            onChangeText={setPartnerIncomeAmount}
            numeric
            placeholder="0"
            large
            inGroup
            currency={currency}
          />
          <FrequencyPills
            options={FREQUENCIES}
            value={partnerIncomeFrequency}
            onChange={setPartnerIncomeFrequency}
            labelMap={{
              daily: t('onboarding.income.q5.frequencyDaily'),
              weekly: t('onboarding.income.q5.frequencyWeekly'),
              fortnightly: t('onboarding.income.q5.frequencyFortnightly'),
              monthly: t('onboarding.income.q5.frequencyMonthly'),
            }}
          />
        </InputGroup>
      </QuestionScreen>
    );
  }

  // ── Q5b: Other income sources ──
  if (step === 'q5b') {
    const requiresOtherIncome = !hasPriorSalaryIncome({
      isNotWorking,
      incomeAmount,
      hasPartner,
      partnerIsNotWorking,
      partnerIncomeAmount,
    });

    return (
      <QuestionScreen
        animationKey={step}
        chapter={t('onboarding.income.chapter')}
        title={t('onboarding.income.q5b.title')}
        helper={requiresOtherIncome
          ? (hasPartner
            ? t('onboarding.income.q5b.helperRequired')
            : t('onboarding.income.q5b.helperRequiredSolo'))
          : t('onboarding.income.q5b.helper')}
        onContinue={handleContinue}
        onBack={handleBack}
        validationError={validationError}
        progress={screenProgress}
        continueLabel={editContinueLabel}
      >
        {requiresOtherIncome ? (
          <View style={{
            padding: 16,
            backgroundColor: C.infoBg,
            borderRadius: R.input,
            borderWidth: 1,
            borderColor: C.infoBorder,
            marginBottom: 12,
          }}>
            <Text style={{ fontSize: 14, color: C.infoText, lineHeight: 22 }}>
              {t('onboarding.income.q5b.requiredNote')}
            </Text>
          </View>
        ) : null}

        <YesNoToggle
          value={hasOtherIncome}
          onChange={setHasOtherIncome}
          yesLabel={t('onboarding.income.q5b.yes')}
          noLabel={t('onboarding.income.q5b.no')}
        />

        <AnimatedSlideIn visible={hasOtherIncome === true}>
          {otherIncomeRows.map((row, index) => (
            <ScrollFocusAnchor key={row.id} focusId={String(row.id)} focusToken={focusToken}>
            <AnimatedRow
              visible={row.visible}
              onAnimationEnd={() => {
                if (!row.visible) finalizeRemove(row.id);
              }}
            >
              <View style={{
                backgroundColor: C.surface,
                borderWidth: 1,
                borderColor: C.border,
                borderRadius: R.card,
                padding: S.cardPad,
              }}>
                <InputGroup nested>
                  <LabeledInput
                    label={t('onboarding.income.q5b.amountLabel')}
                    value={row.amount}
                    onChangeText={(v) => updateOtherRow(index, 'amount', v)}
                    numeric
                    placeholder={t('onboarding.income.q5b.amountPlaceholder')}
                    large
                    inGroup
                    currency={currency}
                  />
                  <FrequencyPills
                    options={FREQUENCIES}
                    value={row.frequency}
                    onChange={(freq) => updateOtherRow(index, 'frequency', freq)}
                    labelMap={{
                      daily: t('onboarding.income.q5.frequencyDaily'),
                      weekly: t('onboarding.income.q5.frequencyWeekly'),
                      fortnightly: t('onboarding.income.q5.frequencyFortnightly'),
                      monthly: t('onboarding.income.q5.frequencyMonthly'),
                    }}
                  />
                </InputGroup>

                {/* Label + remove at bottom */}
                <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-end' }}>
                  <LabeledInput
                    label={t('onboarding.income.q5b.labelPlaceholder')}
                    value={row.label}
                    onChangeText={(v) => updateOtherRow(index, 'label', v)}
                    placeholder={t('onboarding.income.q5b.labelPlaceholder')}
                    inCard
                    containerStyle={{ flex: 1, marginBottom: 0 }}
                  />
                  {otherIncomeRows.length > 1 ? (
                    <RemoveButton onPress={() => removeOtherRow(row.id)} />
                  ) : null}
                </View>
              </View>
            </AnimatedRow>
            </ScrollFocusAnchor>
          ))}

          <AddAnotherButton
            label={`+ ${t('onboarding.income.q5b.addAnother')}`}
            onPress={addOtherRow}
          />
        </AnimatedSlideIn>
      </QuestionScreen>
    );
  }

  // ── Q5c: Savings ──
  if (step === 'q5c') {
    return (
      <QuestionScreen
        animationKey={step}
        chapter={t('onboarding.income.chapter')}
        title={t('onboarding.income.q5c.title')}
        helper={t('onboarding.income.q5c.helper')}
        onContinue={handleContinue}
        onBack={handleBack}
        validationError={validationError}
        progress={screenProgress}
        continueLabel={editContinueLabel}
      >
        <InputGroup label={t('onboarding.income.q5c.balanceLabel')}>
          <LabeledInput
            value={savingsBalance}
            onChangeText={setSavingsBalance}
            numeric
            placeholder={t('onboarding.income.q5c.balancePlaceholder')}
            large
            inGroup
            currency={currency}
          />
        </InputGroup>

      </QuestionScreen>
    );
  }

  // ── Q5d: Financial goal type ──
  if (step === 'q5d') {
    return (
      <QuestionScreen
        animationKey={step}
        chapter={t('onboarding.income.chapter')}
        title={t('onboarding.income.q5d.title')}
        helper={t('onboarding.income.q5d.helper')}
        onContinue={handleContinue}
        onBack={handleBack}
        validationError={validationError}
        progress={screenProgress}
        continueLabel={editContinueLabel}
      >
        <OptionCard
          icon="📉"
          label={t('onboarding.income.q5d.typeReduceCosts')}
          subtitle={t('onboarding.income.q5d.typeReduceCostsDesc')}
          selected={goalType === GOAL_TYPES.REDUCE_COSTS}
          onPress={() => {
            setGoalType(GOAL_TYPES.REDUCE_COSTS);
            setSaveMode(null);
          }}
        />
        <OptionCard
          icon="💰"
          label={t('onboarding.income.q5d.typeSaveMoney')}
          subtitle={t('onboarding.income.q5d.typeSaveMoneyDesc')}
          selected={goalType === GOAL_TYPES.SAVE_MONEY}
          onPress={() => setGoalType(GOAL_TYPES.SAVE_MONEY)}
        />
        <OptionCard
          icon="🎯"
          label={t('onboarding.income.q5d.typeReduceAndSave')}
          subtitle={t('onboarding.income.q5d.typeReduceAndSaveDesc')}
          selected={goalType === GOAL_TYPES.REDUCE_AND_SAVE}
          onPress={() => setGoalType(GOAL_TYPES.REDUCE_AND_SAVE)}
        />
      </QuestionScreen>
    );
  }

  // ── Q5d-mode: Target vs ongoing saving ──
  if (step === 'q5d-mode') {
    return (
      <QuestionScreen
        animationKey={step}
        chapter={t('onboarding.income.chapter')}
        title={t('onboarding.income.q5d.saveModeTitle')}
        helper={t('onboarding.income.q5d.saveModeHelper')}
        onContinue={handleContinue}
        onBack={handleBack}
        validationError={validationError}
        progress={screenProgress}
        continueLabel={editContinueLabel}
      >
        <OptionCard
          icon="🎯"
          label={t('onboarding.income.q5d.saveModeTarget')}
          subtitle={t('onboarding.income.q5d.saveModeTargetDesc')}
          selected={saveMode === SAVE_MODES.TARGET}
          onPress={() => setSaveMode(SAVE_MODES.TARGET)}
        />
        <OptionCard
          icon="🔄"
          label={t('onboarding.income.q5d.saveModeOngoing')}
          subtitle={t('onboarding.income.q5d.saveModeOngoingDesc')}
          selected={saveMode === SAVE_MODES.ONGOING}
          onPress={() => setSaveMode(SAVE_MODES.ONGOING)}
        />
      </QuestionScreen>
    );
  }

  // ── Q5d-details: Goal amount fields ──
  if (step === 'q5d-details') {
    const isTarget = saveMode === SAVE_MODES.TARGET;
    return (
      <QuestionScreen
        animationKey={step}
        chapter={t('onboarding.income.chapter')}
        title={isTarget
          ? t('onboarding.income.q5d.targetTitle')
          : t('onboarding.income.q5d.ongoingTitle')}
        helper={isTarget
          ? t('onboarding.income.q5d.targetHelper')
          : t('onboarding.income.q5d.ongoingHelper')}
        onContinue={handleContinue}
        onBack={handleBack}
        validationError={validationError}
        progress={screenProgress}
        continueLabel={editContinueLabel}
      >
        {isTarget ? (
          <>
            <InputGroup label={t('onboarding.income.q5d.descriptionLabel')} optional>
              <LabeledInput
                value={goalDescription}
                onChangeText={setGoalDescription}
                placeholder={t('onboarding.income.q5d.descriptionPlaceholder')}
                inCard
                inGroup
              />
            </InputGroup>

            <InputGroup label={t('onboarding.income.q5d.amountLabel')}>
              <LabeledInput
                value={goalAmount}
                onChangeText={setGoalAmount}
                numeric
                placeholder={t('onboarding.income.q5d.amountPlaceholder')}
                large
                inGroup
                currency={currency}
              />
            </InputGroup>

            <InputGroup label={t('onboarding.income.q5d.dateLabel')}>
              <DatePicker
                value={goalDate}
                onChange={setGoalDate}
                showDay={false}
                inGroup
                yearEnd={new Date().getFullYear() + 30}
              />
            </InputGroup>
          </>
        ) : (
          <InputGroup label={t('onboarding.income.q5d.monthlyTargetLabel')}>
            <LabeledInput
              value={savingsMonthlyTarget}
              onChangeText={setSavingsMonthlyTarget}
              numeric
              placeholder={t('onboarding.income.q5d.monthlyTargetPlaceholder')}
              large
              inGroup
              currency={currency}
            />
          </InputGroup>
        )}
      </QuestionScreen>
    );
  }

  return null;
}
