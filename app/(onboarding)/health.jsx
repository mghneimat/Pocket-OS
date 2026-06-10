import { useState, useEffect, useRef } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useI18n } from '../../lib/i18n';
import { getData, setData } from '../../lib/storage';
import { getCurrencySymbol } from '../../lib/currency';
import { formatCurrency } from '../../lib/finance';
import { computeRenewalSavingsPlan } from '../../lib/healthInsuranceBudget';
import { C, S, T, R } from '../../constants/onboarding-theme';
import QuestionScreen from '../../components/onboarding/QuestionScreen';
import OptionCard from '../../components/onboarding/OptionCard';
import PillToggle from '../../components/onboarding/PillToggle';
import DatePicker from '../../components/onboarding/DatePicker';
import AnimatedSlideIn from '../../components/onboarding/AnimatedSlideIn';
import LabeledInput from '../../components/onboarding/LabeledInput';
import FrequencyPills from '../../components/onboarding/FrequencyPills';
import YesNoToggle from '../../components/onboarding/YesNoToggle';
import InputGroup from '../../components/onboarding/InputGroup';
import { useSectionExit } from '../../lib/finishOnboardingSection';

const FREQUENCIES = ['monthly', 'quarterly', 'annual', 'custom'];
const SWITCH_FREQUENCIES = ['monthly', 'quarterly', 'annual', 'custom'];

/**
 * Calculate end date from start date + months, minus 1 day.
 * Returns "DD/MM/YYYY" string or empty string if inputs are invalid.
 */
function calcEndDate(startDate, months) {
  if (!startDate || !months) return '';
  const parts = startDate.split('/');
  if (parts.length !== 3) return '';
  const d = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  const y = parseInt(parts[2], 10);
  const numMonths = parseInt(months, 10);
  if (isNaN(d) || isNaN(m) || isNaN(y) || isNaN(numMonths) || numMonths <= 0) return '';
  const end = new Date(y, m - 1 + numMonths, d - 1);
  const endDay = String(end.getDate()).padStart(2, '0');
  const endMonth = String(end.getMonth() + 1).padStart(2, '0');
  const endYear = String(end.getFullYear());
  return `${endDay}/${endMonth}/${endYear}`;
}

export default function HealthScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const { isEditMode, completeSection, leaveSection, editContinueLabel } = useSectionExit();

  const [household, setHousehold] = useState(null);
  const [occupation, setOccupation] = useState(null);
  const [members, setMembers] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
  const [validationError, setValidationError] = useState('');

  // Per-member health insurance data
  const [memberData, setMemberData] = useState({});

  // ── Loaded data ──
  const [currencyCode, setCurrencyCode] = useState('CZK');
  const [savingsBalance, setSavingsBalance] = useState(0);
  const currency = getCurrencySymbol(currencyCode);

  useEffect(() => {
    (async () => {
      const h = await getData('pocketos_household');
      const occ = await getData('pocketos_occupation');
      const loc = await getData('pocketos_location');
      const income = await getData('pocketos_income');
      if (loc?.currency) setCurrencyCode(loc.currency);
      if (income?.savingsBalance != null) {
        setSavingsBalance(Number(income.savingsBalance) || 0);
      }
      if (occ) setOccupation(occ);

      setHousehold(h);
      const m = [];
      m.push({ id: 'user', label: t('onboarding.health.you'), ref: 'user' });
      if (h?.partnerName) {
        m.push({ id: 'partner', label: h.partnerName, ref: 'partner' });
      }
      if (h?.children?.length) {
        h.children.forEach((child, idx) => {
          m.push({ id: `child_${idx}`, label: child.displayName || `${t('onboarding.health.child')} ${idx + 1}`, ref: `child_${idx}`, ageGroup: child.ageGroup });
        });
      }
      setMembers(m);

      // Initialise member data
      const initData = {};
      m.forEach(member => {
        initData[member.id] = { confirmed: false };
      });
      setMemberData(initData);
    })();
  }, []);

  const updateMember = (id, updates) => {
    setMemberData(prev => ({ ...prev, [id]: { ...prev[id], ...updates } }));
  };

  const persistHealth = async () => {
    const prunedHealth = {};
    members.forEach((member) => {
      if (memberData[member.id]) {
        prunedHealth[member.id] = memberData[member.id];
      }
    });
    await completeSection({
      persist: async () => { await setData('pocketos_health', prunedHealth); },
      onboardingPatch: { completed: false, currentStep: 'health', percentComplete: 75 },
      nextRoute: household?.children?.length > 0
        ? '/(onboarding)/splash-children'
        : '/(onboarding)/splash-pets',
    });
  };

  const handleContinue = async () => {
    setValidationError('');

    if (isEditMode) {
      await persistHealth();
      return;
    }

    // Check current tab is confirmed or skipped
    const currentMember = members[activeTab];
    if (!currentMember) return;

    const data = memberData[currentMember.id];
    if (!data?.confirmed && !data?.skipped) {
      setValidationError(t('onboarding.health.validation'));
      return;
    }

    // Find the next unresolved member (not confirmed or skipped)
    const nextUnresolved = members.find((m, idx) => {
      if (idx <= activeTab) return false; // skip current and previous
      const d = memberData[m.id];
      return !d?.confirmed && !d?.skipped;
    });

    if (nextUnresolved) {
      // Jump to the first unresolved member
      setActiveTab(members.indexOf(nextUnresolved));
      return;
    }

    await persistHealth();
  };

  const handleBack = () => {
    setValidationError('');
    if (activeTab > 0) {
      setActiveTab(activeTab - 1);
    } else {
      leaveSection(() => router.replace('/(onboarding)/splash-health'));
    }
  };

  const progress = 75;
  const screenProgress = isEditMode ? undefined : progress;

  /** Persistent option cards — lives outside renderMemberForm so its
   *  Animated.Value refs survive tab switches, enabling smooth
   *  collapse/expand transitions between members. */
  const renderOptionCards = () => {
    const member = members[activeTab];
    if (!member) return null;
    const data = memberData[member.id] || {};

    const isEmployer = data.coverage === 'employer';
    const isPrivate = data.coverage === 'private';
    const isSkipped = data.skipped === true;

    const handleEmployerPress = () => {
      if (isEmployer) {
        updateMember(member.id, { coverage: null, skipped: false, confirmed: false });
      } else {
        updateMember(member.id, { coverage: 'employer', skipped: false, confirmed: true });
      }
      setValidationError('');
    };
    const handlePrivatePress = () => {
      if (isPrivate) {
        updateMember(member.id, { coverage: null, skipped: false, confirmed: false });
      } else {
        updateMember(member.id, { coverage: 'private', skipped: false, confirmed: true });
      }
      setValidationError('');
    };
    const handleSkipPress = () => {
      if (isSkipped) {
        updateMember(member.id, { skipped: false, coverage: null, confirmed: false });
      } else {
        updateMember(member.id, { skipped: true, coverage: null, confirmed: false });
      }
      setValidationError('');
    };

    return (
      <View style={{ marginBottom: 12 }}>
        <AnimatedSlideIn visible={!isPrivate && !isSkipped}>
          <OptionCard
            label={t('onboarding.health.coveredByEmployer')}
            selected={isEmployer}
            onPress={handleEmployerPress}
          />
        </AnimatedSlideIn>
        <AnimatedSlideIn visible={!isEmployer && !isSkipped}>
          <OptionCard
            label={t('onboarding.health.payPrivately')}
            selected={isPrivate}
            onPress={handlePrivatePress}
          />
        </AnimatedSlideIn>
        <AnimatedSlideIn visible={!isEmployer && !isPrivate}>
          <OptionCard
            label={t('common.skip')}
            selected={isSkipped}
            onPress={handleSkipPress}
          />
        </AnimatedSlideIn>
      </View>
    );
  };

  const isMemberEmployee = (member) => {
    if (!occupation) return false;
    if (member.ref === 'user') return occupation.user === 'employee';
    if (member.ref === 'partner') return occupation.partner === 'employee';
    return false;
  };

  const renderPrepaidReservePanel = (member, data, { lumpPremium, budgetIncluded, onBudgetChange }) => {
    const plan = computeRenewalSavingsPlan({
      premium: lumpPremium,
      endDate: data.endDate,
      savingsBalance,
    });

    return (
      <View style={{ marginTop: 8 }}>
        <View style={{
          padding: 16,
          backgroundColor: C.chipSelectedBg || 'rgba(58,90,140,0.08)',
          borderRadius: R.card,
          borderWidth: 1,
          borderColor: C.border,
          marginBottom: 12,
        }}
        >
          <Text style={{ ...T.helper, color: C.text, marginBottom: 6 }}>
            {t('onboarding.health.renewReserveSummary', {
              amount: formatCurrency(plan.suggestedMonthly, currency),
              months: plan.monthsRemaining,
              total: formatCurrency(plan.totalNeeded, currency),
            })}
          </Text>
          <Text style={{ ...T.caption, color: C.muted }}>
            {t('onboarding.health.renewReserveExplain')}
          </Text>
        </View>

        {plan.isTight ? (
          <View style={{
            padding: 12,
            backgroundColor: C.warningBg || 'rgba(200,140,40,0.1)',
            borderRadius: R.card,
            borderWidth: 1,
            borderColor: C.warningBorder || 'rgba(200,140,40,0.25)',
            marginBottom: 12,
          }}
          >
            <Text style={{ ...T.caption, color: C.text }}>
              {t('onboarding.health.renewReserveTightWarning', {
                shortfall: formatCurrency(plan.shortfall, currency),
                months: plan.monthsRemaining,
              })}
            </Text>
          </View>
        ) : null}

        <Text style={{ ...T.fieldLabel, color: C.muted, marginBottom: 8 }}>
          {t('onboarding.health.budgetForRenewLabel')}
        </Text>
        <Text style={{ ...T.caption, color: C.muted, marginBottom: 10 }}>
          {t('onboarding.health.budgetForRenewHelper')}
        </Text>
        <YesNoToggle
          value={budgetIncluded}
          onChange={onBudgetChange}
        />

        <AnimatedSlideIn visible={budgetIncluded === true}>
          <View style={{ marginTop: 12 }}>
            <OptionCard
              label={t('onboarding.health.renewUseSuggested', {
                amount: formatCurrency(plan.suggestedMonthly, currency),
              })}
              selected={data.renewalBudgetMode !== 'custom'}
              onPress={() => updateMember(member.id, { renewalBudgetMode: 'suggested' })}
              style={{ marginBottom: 8 }}
            />
            <OptionCard
              label={t('onboarding.health.renewUseCustom')}
              subtitle={t('onboarding.health.renewUseCustomHelper')}
              selected={data.renewalBudgetMode === 'custom'}
              onPress={() => updateMember(member.id, { renewalBudgetMode: 'custom' })}
              style={{ marginBottom: 8 }}
            />
          </View>
          <AnimatedSlideIn visible={data.renewalBudgetMode === 'custom'}>
            <InputGroup label={t('onboarding.health.renewCustomMonthlyLabel')} style={{ marginTop: 4 }}>
              <LabeledInput
                value={data.renewalCustomMonthly || ''}
                onChangeText={(v) => updateMember(member.id, { renewalCustomMonthly: v.replace(/[^0-9]/g, '') })}
                numeric
                placeholder={t('onboarding.health.renewCustomMonthlyPlaceholder')}
                large
                inGroup
                currency={currency}
              />
            </InputGroup>
          </AnimatedSlideIn>
        </AnimatedSlideIn>
      </View>
    );
  };

  const renderMemberForm = (member) => {
    const data = memberData[member.id] || {};

    // Determine which option is active
    const isEmployer = data.coverage === 'employer';
    const isPrivate = data.coverage === 'private';
    const isSkipped = data.skipped === true;
    const showEmployerNote = isEmployer && isMemberEmployee(member);
    const showPrepaidReserve = data.endDateType === 'fixed'
      && data.premiumPaidInFull === true
      && !!data.endDate;

    return (
      <View>
        {/* ── Employer coverage info (employees only) ── */}
        <AnimatedSlideIn visible={showEmployerNote}>
          <View style={{ padding: 16, backgroundColor: C.positiveBg || 'rgba(58,140,110,0.08)', borderRadius: R.card, borderWidth: 1, borderColor: C.positiveBorder || 'rgba(58,140,110,0.2)', marginBottom: 20 }}>
            <Text style={{ ...T.helper, color: C.text }}>
              {t('onboarding.health.coveredByEmployerNote')}
            </Text>
          </View>
        </AnimatedSlideIn>

        {/* ── Private coverage form ── */}
        <AnimatedSlideIn visible={isPrivate}>
          <View style={{ marginBottom: 20 }}>
            {/* Premium */}
            <InputGroup label={t('onboarding.health.premiumLabel')}>
              <LabeledInput
                value={data.premium || ''}
                onChangeText={(v) => updateMember(member.id, { premium: v.replace(/[^0-9]/g, '') })}
                numeric
                placeholder={t('onboarding.health.premiumPlaceholder')}
                large
                inGroup
                currency={currency}
              />
              <FrequencyPills
                options={FREQUENCIES}
                value={data.frequency}
                onChange={(freq) => updateMember(member.id, { frequency: freq })}
                small
              />
            </InputGroup>
            {/* Custom frequency — months input */}
            <AnimatedSlideIn visible={data.frequency === 'custom'}>
              <LabeledInput
                label={t('onboarding.health.customFrequencyLabel')}
                value={data.customFrequencyMonths || ''}
                onChangeText={(v) => {
                  updateMember(member.id, { customFrequencyMonths: v });
                  if (data.startDate && v) {
                    const endDate = calcEndDate(data.startDate, v);
                    if (endDate) updateMember(member.id, { endDate });
                  }
                }}
                numeric
                placeholder={t('onboarding.health.customFrequencyPlaceholder')}
                inCard
              />
            </AnimatedSlideIn>
            {/* Start date */}
            <Text style={{ ...T.fieldLabel, color: C.muted, marginBottom: 6, marginTop: 12 }}>
              {t('onboarding.health.startDateLabel')}
            </Text>
            <DatePicker
              value={data.startDate || ''}
              onChange={(v) => {
                updateMember(member.id, { startDate: v });
                if (data.frequency === 'custom' && data.customFrequencyMonths && v) {
                  const endDate = calcEndDate(v, data.customFrequencyMonths);
                  if (endDate) updateMember(member.id, { endDate });
                }
              }}
            />
            {/* Contract type */}
            <Text style={{ ...T.fieldLabel, color: C.muted, marginBottom: 8, marginTop: 12 }}>
              {t('onboarding.health.contractTypeLabel')}
            </Text>
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
              <Pressable
                onPress={() => updateMember(member.id, { endDateType: 'ongoing' })}
                style={({ pressed }) => ({
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 8,
                  borderWidth: 1.5,
                  borderColor: data.endDateType === 'ongoing' ? C.primary : C.border,
                  backgroundColor: data.endDateType === 'ongoing' ? C.chipSelectedBg : C.surface,
                  alignItems: 'center',
                })}
              >
                <Text style={{ fontSize: 13, color: data.endDateType === 'ongoing' ? C.primary : C.muted, fontWeight: '500' }}>
                  {t('onboarding.health.ongoing')}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => updateMember(member.id, { endDateType: 'fixed' })}
                style={({ pressed }) => ({
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 8,
                  borderWidth: 1.5,
                  borderColor: data.endDateType === 'fixed' ? C.primary : C.border,
                  backgroundColor: data.endDateType === 'fixed' ? C.chipSelectedBg : C.surface,
                  alignItems: 'center',
                })}
              >
                <Text style={{ fontSize: 13, color: data.endDateType === 'fixed' ? C.primary : C.muted, fontWeight: '500' }}>
                  {t('onboarding.health.fixed')}
                </Text>
              </Pressable>
            </View>
            {/* End date — custom frequency auto-calculated */}
            <AnimatedSlideIn visible={data.frequency === 'custom'}>
              <Text style={{ ...T.fieldLabel, color: C.muted, marginBottom: 6 }}>
                {t('onboarding.health.endDateLabel')}
              </Text>
              <DatePicker
                value={data.endDate || ''}
                onChange={(v) => updateMember(member.id, { endDate: v })}
              />
            </AnimatedSlideIn>

            {/* End date — fixed contract (month/year only) */}
            <AnimatedSlideIn visible={data.endDateType === 'fixed' && data.frequency !== 'custom'}>
              <Text style={{ ...T.fieldLabel, color: C.muted, marginBottom: 6, marginTop: 12 }}>
                {t('onboarding.health.endDateLabel')}
              </Text>
              <DatePicker
                value={data.endDate || ''}
                onChange={(v) => updateMember(member.id, { endDate: v })}
                showDay={false}
              />
            </AnimatedSlideIn>

            {/* Paid in full — fixed contracts only */}
            <AnimatedSlideIn visible={data.endDateType === 'fixed' && !!data.endDate}>
              <Text style={{ ...T.fieldLabel, color: C.muted, marginBottom: 8, marginTop: 16 }}>
                {t('onboarding.health.premiumPaidInFullLabel')}
              </Text>
              <Text style={{ ...T.caption, color: C.muted, marginBottom: 10 }}>
                {t('onboarding.health.premiumPaidInFullHelper')}
              </Text>
              <YesNoToggle
                value={data.premiumPaidInFull}
                onChange={(v) => {
                  const updates = { premiumPaidInFull: v };
                  if (v && data.renewalPlan === 'renew') {
                    updates.budgetForRenewal = data.budgetForRenewal ?? true;
                    updates.renewalBudgetMode = data.renewalBudgetMode || 'suggested';
                  }
                  if (v && data.renewalPlan === 'switch') {
                    updates.budgetForSwitch = data.budgetForSwitch ?? true;
                    updates.renewalBudgetMode = data.renewalBudgetMode || 'suggested';
                  }
                  updateMember(member.id, updates);
                }}
              />
            </AnimatedSlideIn>

            {/* Renewal plan after fixed contract */}
            <AnimatedSlideIn visible={data.endDateType === 'fixed'}>
              <Text style={{ ...T.fieldLabel, color: C.muted, marginBottom: 8, marginTop: 16 }}>
                {t('onboarding.health.renewalPlanLabel')}
              </Text>
              {[
                { key: 'renew', label: 'renewalRenew', helper: 'renewalRenewHelper' },
                { key: 'switch', label: 'renewalSwitch', helper: 'renewalSwitchHelper' },
                { key: 'end', label: 'renewalEnd', helper: 'renewalEndHelper' },
              ].map((opt) => (
                <OptionCard
                  key={opt.key}
                  label={t(`onboarding.health.${opt.label}`)}
                  subtitle={t(`onboarding.health.${opt.helper}`)}
                  selected={data.renewalPlan === opt.key}
                  onPress={() => {
                    const updates = { renewalPlan: opt.key };
                    if (opt.key === 'renew' && data.premiumPaidInFull === true) {
                      updates.budgetForRenewal = data.budgetForRenewal ?? true;
                      updates.renewalBudgetMode = data.renewalBudgetMode || 'suggested';
                    }
                    if (opt.key === 'switch' && data.premiumPaidInFull === true) {
                      updates.budgetForSwitch = data.budgetForSwitch ?? true;
                      updates.renewalBudgetMode = data.renewalBudgetMode || 'suggested';
                    }
                    updateMember(member.id, updates);
                  }}
                  style={{ marginBottom: 8 }}
                />
              ))}
            </AnimatedSlideIn>

            {/* Renewal reserve — prepaid fixed + renew same */}
            <AnimatedSlideIn
              visible={showPrepaidReserve && data.renewalPlan === 'renew' && !!data.premium}
            >
              {renderPrepaidReservePanel(member, data, {
                lumpPremium: data.premium,
                budgetIncluded: data.budgetForRenewal,
                onBudgetChange: (v) => updateMember(member.id, {
                  budgetForRenewal: v,
                  renewalBudgetMode: v ? (data.renewalBudgetMode || 'suggested') : 'skip',
                  renewalCustomMonthly: v ? data.renewalCustomMonthly : '',
                }),
              })}
            </AnimatedSlideIn>

            {/* Switch plan — expected new premium + same savings planning when prepaid */}
            <AnimatedSlideIn visible={data.endDateType === 'fixed' && data.renewalPlan === 'switch'}>
              <Text style={{ ...T.caption, color: C.muted, marginBottom: 10, marginTop: 8 }}>
                {t('onboarding.health.switchPlanIntro')}
              </Text>
              <InputGroup label={t('onboarding.health.switchPremiumLabel')}>
                <LabeledInput
                  value={data.switchPremiumAmount || ''}
                  onChangeText={(v) => updateMember(member.id, { switchPremiumAmount: v.replace(/[^0-9]/g, '') })}
                  numeric
                  placeholder={t('onboarding.health.switchPremiumPlaceholder')}
                  large
                  inGroup
                  currency={currency}
                />
                <Text style={{ ...T.caption, color: C.muted, marginTop: 8, marginBottom: 4 }}>
                  {t('onboarding.health.switchPremiumHelper')}
                </Text>
                <FrequencyPills
                  options={SWITCH_FREQUENCIES}
                  value={data.switchPremiumFrequency || 'monthly'}
                  onChange={(freq) => updateMember(member.id, {
                    switchPremiumFrequency: freq,
                    switchCustomFrequencyMonths: freq === 'custom' ? data.switchCustomFrequencyMonths : '',
                  })}
                  small
                />
                <AnimatedSlideIn visible={data.switchPremiumFrequency === 'custom'}>
                  <LabeledInput
                    label={t('onboarding.health.customFrequencyLabel')}
                    value={data.switchCustomFrequencyMonths || ''}
                    onChangeText={(v) => updateMember(member.id, { switchCustomFrequencyMonths: v })}
                    numeric
                    placeholder={t('onboarding.health.customFrequencyPlaceholder')}
                    inCard
                  />
                </AnimatedSlideIn>
                <Text style={{ ...T.caption, color: C.muted, marginTop: 8 }}>
                  {t('onboarding.health.switchPremiumFrequencyHelper')}
                </Text>
              </InputGroup>
            </AnimatedSlideIn>

            <AnimatedSlideIn
              visible={showPrepaidReserve && data.renewalPlan === 'switch' && !!data.switchPremiumAmount}
            >
              {renderPrepaidReservePanel(member, data, {
                lumpPremium: data.switchPremiumAmount,
                budgetIncluded: data.budgetForSwitch,
                onBudgetChange: (v) => updateMember(member.id, {
                  budgetForSwitch: v,
                  renewalBudgetMode: v ? (data.renewalBudgetMode || 'suggested') : 'skip',
                  renewalCustomMonthly: v ? data.renewalCustomMonthly : '',
                }),
              })}
            </AnimatedSlideIn>
          </View>
        </AnimatedSlideIn>
      </View>
    );
  };

  const currentMember = members[activeTab];

  return (
    <QuestionScreen
      chapter={t('onboarding.health.chapter')}
      title={currentMember ? t('onboarding.health.title', { name: currentMember.label }) : t('onboarding.health.title')}
      helper={currentMember ? t('onboarding.health.helper', { name: currentMember.label }) : t('onboarding.health.helper')}
      onContinue={handleContinue}
      onBack={handleBack}
      validationError={validationError}
      progress={screenProgress}
      continueLabel={editContinueLabel}
      animationKey={activeTab}
    >
      {/* Tab row — full-width pills */}
      {members.length > 0 && (
        <View style={{ flexDirection: 'row', borderRadius: R.input, borderWidth: 1, borderColor: C.border, overflow: 'hidden', marginBottom: 20 }}>
          {members.map((member, idx) => (
            <Pressable
              key={member.id}
              onPress={() => { setActiveTab(idx); setValidationError(''); }}
              style={{
                flex: 1,
                paddingVertical: 10,
                backgroundColor: activeTab === idx ? C.chipSelectedBg : 'transparent',
                alignItems: 'center',
              }}
            >
              <Text style={{
                fontSize: 13,
                fontWeight: '500',
                color: activeTab === idx ? C.primary : C.muted,
              }}>
                {member.label}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      {/* Persistent option cards — stays mounted across tab switches so
          AnimatedSlideIn refs survive and transitions are smooth */}
      {renderOptionCards()}

      {/* Current member form (employer note / private form) */}
      {currentMember && renderMemberForm(currentMember)}
    </QuestionScreen>
  );
}
