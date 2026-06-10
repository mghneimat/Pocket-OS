import { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useI18n } from '../../lib/i18n';
import { getData, setData } from '../../lib/storage';
import { getCurrencySymbol } from '../../lib/currency';
import { C, S, T, R } from '../../constants/onboarding-theme';
import QuestionScreen from '../../components/onboarding/QuestionScreen';
import PillToggle from '../../components/onboarding/PillToggle';
import DatePicker from '../../components/onboarding/DatePicker';
import AnimatedSlideIn from '../../components/onboarding/AnimatedSlideIn';
import LabeledInput from '../../components/onboarding/LabeledInput';
import YesNoToggle from '../../components/onboarding/YesNoToggle';
import FrequencyPills from '../../components/onboarding/FrequencyPills';
import AddAnotherButton from '../../components/onboarding/AddAnotherButton';
import AnimatedRow from '../../components/onboarding/AnimatedRow';
import CostCard from '../../components/onboarding/CostCard';
import InputGroup from '../../components/onboarding/InputGroup';
import RemoveButton from '../../components/onboarding/RemoveButton';
import ScrollFocusAnchor from '../../components/onboarding/ScrollFocusAnchor';
import { useSectionExit } from '../../lib/finishOnboardingSection';

const PET_TYPES = ['dog', 'cat', 'bird', 'other'];
const FREQUENCIES = ['monthly', 'quarterly', 'annual'];

export default function PetsScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const { isEditMode, completeSection, leaveSection, editContinueLabel } = useSectionExit();

  // ── Loaded data ──
  const [currencyCode, setCurrencyCode] = useState('CZK');
  const currency = getCurrencySymbol(currencyCode);

  const [step, setStep] = useState('q10');
  const [validationError, setValidationError] = useState('');

  // Q10 — Has pets
  const [hasPets, setHasPets] = useState(null);

  // Q10a — Pet details
  const [pets, setPets] = useState([]);
  const [petIndex, setPetIndex] = useState(0);
  const [focusToken, setFocusToken] = useState(null);
  const finalizedPetRemovals = useRef(new Set());

  const currentPet = pets[petIndex];

  // ── Load currency from location data ──
  useEffect(() => {
    (async () => {
      const loc = await getData('pocketos_location');
      if (loc?.currency) setCurrencyCode(loc.currency);
    })();
  }, []);

  const persistPets = async () => {
    const data = hasPets === false ? [] : pets;
    await completeSection({
      persist: async () => { await setData('pocketos_pets', data); },
      onboardingPatch: { completed: false, currentStep: 'pets', percentComplete: 80 },
      nextRoute: '/(onboarding)/splash-subscriptions',
    });
  };

  const handleContinue = async () => {
    setValidationError('');

    if (isEditMode) {
      await persistPets();
      return;
    }

    if (step === 'q10') {
      if (hasPets === null) {
        setValidationError(t('onboarding.pets.q10.validation'));
        return;
      }
      if (hasPets) {
        if (pets.length === 0) addPet();
        setPetIndex(0);
        setStep('q10a');
      } else {
        await completeSection({
          persist: async () => { await setData('pocketos_pets', []); },
          onboardingPatch: { completed: false, currentStep: 'pets', percentComplete: 80 },
          nextRoute: '/(onboarding)/splash-subscriptions',
        });
      }
      return;
    }

    if (step === 'q10a') {
      const invalidIdx = pets.findIndex((p) => !p.type);
      if (invalidIdx !== -1) {
        setPetIndex(invalidIdx);
        setValidationError(t('onboarding.pets.q10a.validation'));
        return;
      }

      await completeSection({
        persist: async () => { await setData('pocketos_pets', pets); },
        onboardingPatch: { completed: false, currentStep: 'pets', percentComplete: 80 },
        nextRoute: '/(onboarding)/splash-subscriptions',
      });
      return;
    }
  };

  const handleBack = async () => {
    setValidationError('');
    if (step === 'q10a') {
      setStep('q10');
      return;
    }
    await setData('pocketos_pets', pets);
    leaveSection(() => router.replace('/(onboarding)/splash-pets'));
  };

  const updatePet = (idx, updates) => {
    const updated = [...pets];
    updated[idx] = { ...updated[idx], ...updates };
    setPets(updated);
  };

  const addPet = () => {
    const id = `pet_${Date.now()}`;
    const newPet = {
      id,
      visible: true,
      type: null,
      name: '',
      foodAmount: '',
      foodFrequency: 'monthly',
      vetAmount: '',
      vetFrequency: 'annual',
      hasInsurance: null,
      insurancePremium: '',
      insuranceFrequency: 'annual',
      insuranceRenewalDate: '',
      groomingAmount: '',
      groomingFrequency: 'monthly',
      otherCostAmount: '',
      otherCostFrequency: 'monthly',
      dogTax: true,
      dogTaxAmount: '1500',
      activeCostSections: {},
    };
    setPets([...pets, newPet]);
    setPetIndex(pets.length);
    setFocusToken(id);
  };

  const removePet = (idx) => {
    setPets((prev) => prev.map((p, i) => (i === idx ? { ...p, visible: false } : p)));
  };

  const finalizeRemovePet = (idx) => {
    const pet = pets[idx];
    const key = pet?.id || String(idx);
    if (finalizedPetRemovals.current.has(key)) return;
    finalizedPetRemovals.current.add(key);

    setPets((prev) => {
      const next = prev.filter((_, i) => i !== idx);
      setPetIndex((current) => {
        if (current >= next.length && current > 0) return next.length - 1;
        if (current === idx && idx > 0) return idx - 1;
        return current;
      });
      return next;
    });
  };

  const progress = 80;
  const screenProgress = isEditMode ? undefined : progress;

  const renderQ10 = () => (
    <View>
      <Text style={{ ...T.helper, color: C.muted, marginBottom: 16 }}>
        {t('onboarding.pets.q10.helper')}
      </Text>
      <YesNoToggle
        value={hasPets}
        onChange={(val) => { setHasPets(val); setValidationError(''); }}
        yesLabel={t('onboarding.pets.q10.yes')}
        noLabel={t('onboarding.pets.q10.no')}
      />
    </View>
  );

  const toggleCostSection = useCallback((idx, section) => {
    const pet = pets[idx];
    if (!pet) return;
    const current = pet.activeCostSections?.[section];
    updatePet(idx, {
      activeCostSections: { ...pet.activeCostSections, [section]: !current },
    });
  }, [pets, updatePet]);

  const COST_SECTIONS = [
    { key: 'food', labelKey: 'onboarding.pets.q10a.foodLabel', amountField: 'foodAmount', freqField: 'foodFrequency' },
    { key: 'vet', labelKey: 'onboarding.pets.q10a.vetLabel', amountField: 'vetAmount', freqField: 'vetFrequency' },
    { key: 'grooming', labelKey: 'onboarding.pets.q10a.groomingLabel', amountField: 'groomingAmount', freqField: 'groomingFrequency' },
    { key: 'otherCost', labelKey: 'onboarding.pets.q10a.otherCostLabel', amountField: 'otherCostAmount', freqField: 'otherCostFrequency' },
  ];

  const renderCostSectionPill = (pet, idx, section) => {
    const isActive = pet.activeCostSections?.[section.key];
    return (
      <Pressable
        key={section.key}
        onPress={() => toggleCostSection(idx, section.key)}
        style={({ pressed }) => ({
          width: '48%',
          paddingVertical: 12,
          paddingHorizontal: 14,
          borderRadius: 12,
          borderWidth: 1.5,
          borderColor: isActive ? C.primary : pressed ? C.placeholder : C.border,
          backgroundColor: isActive
            ? C.chipSelectedBg
            : pressed
              ? C.bg
              : C.surface,
          marginBottom: 8,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
        })}
      >
        <Text style={{
          fontSize: 13,
          fontWeight: isActive ? '600' : '500',
          color: isActive ? C.primary : C.muted,
          marginRight: isActive ? 6 : 0,
        }}>
          {t(section.labelKey)}
        </Text>
        {isActive && (
          <View style={{
            width: 18,
            height: 18,
            borderRadius: 9,
            backgroundColor: C.primary,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '700' }}>{'✓'}</Text>
          </View>
        )}
      </Pressable>
    );
  };

  const renderCostSectionContent = (pet, idx, section) => {
    const isActive = pet.activeCostSections?.[section.key];
    const placeholderKey = section.key === 'food' ? 'foodPlaceholder'
      : section.key === 'vet' ? 'vetPlaceholder'
      : section.key === 'grooming' ? 'groomingPlaceholder'
      : 'otherCostPlaceholder';
    return (
      <AnimatedSlideIn visible={isActive} key={section.key}>
        <CostCard title={t(section.labelKey)} style={{ marginBottom: 16 }}>
          <InputGroup nested label={t('onboarding.pets.q10a.amountLabel')}>
            <LabeledInput
              value={pet[section.amountField]}
              onChangeText={(v) => updatePet(idx, { [section.amountField]: v })}
              numeric
              placeholder={t(`onboarding.pets.q10a.${placeholderKey}`)}
              large
              inGroup
              currency={currency}
            />
            <FrequencyPills
              options={FREQUENCIES}
              value={pet[section.freqField]}
              onChange={(freq) => updatePet(idx, { [section.freqField]: freq })}
              small
            />
          </InputGroup>
        </CostCard>
      </AnimatedSlideIn>
    );
  };

  const renderPetForm = (pet, idx) => (
    <View key={idx} style={{ marginBottom: 24, padding: 16, backgroundColor: C.surface, borderRadius: 12, borderWidth: 1, borderColor: C.border }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Text style={{ fontSize: 15, fontWeight: '600', color: C.primary }}>
          {t('onboarding.pets.q10a.title', { n: idx + 1 })}
        </Text>
        {pets.length > 1 ? <RemoveButton onPress={() => removePet(idx)} /> : null}
      </View>

      {/* Pet type pills */}
      <Text style={{ ...T.fieldLabel, color: C.muted, marginBottom: 8 }}>
        {t('onboarding.pets.q10a.typeLabel')}
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', borderRadius: R.input, borderWidth: 1, borderColor: C.border, overflow: 'hidden', marginBottom: 16 }}>
        {PET_TYPES.map(type => (
          <PillToggle
            key={type}
            label={t(`onboarding.pets.q10a.${type}`)}
            selected={pet.type === type}
            onPress={() => updatePet(idx, { type })}
            paddingVertical={10}
            fontSize={13}
            fontWeight="500"
          />
        ))}
      </View>

      {/* Pet name */}
      <LabeledInput
        label={t('onboarding.pets.q10a.nameLabel')}
        value={pet.name}
        onChangeText={(v) => updatePet(idx, { name: v })}
        placeholder={t('onboarding.pets.q10a.namePlaceholder')}
        containerStyle={{ marginBottom: 16 }}
      />

      {/* Cost section pills — selectable, multiple at a time */}
      <Text style={{ ...T.fieldLabel, color: C.muted, marginBottom: 8 }}>
        {t('onboarding.pets.q10a.costsLabel')}
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 4 }}>
        {COST_SECTIONS.map(section => renderCostSectionPill(pet, idx, section))}
      </View>

      {/* Animated cost section contents */}
      {COST_SECTIONS.map(section => renderCostSectionContent(pet, idx, section))}

      {/* Pet insurance */}
      <Text style={{ ...T.fieldLabel, color: C.muted, marginBottom: 8 }}>
        {t('onboarding.pets.q10a.insuranceLabel')}
      </Text>
      <YesNoToggle
        value={pet.hasInsurance}
        onChange={(val) => updatePet(idx, { hasInsurance: val })}
        containerStyle={{ marginBottom: 12 }}
      />
      <AnimatedSlideIn visible={pet.hasInsurance === true}>
        <InputGroup label={t('onboarding.pets.q10a.insurancePremiumLabel')}>
          <LabeledInput
            value={pet.insurancePremium}
            onChangeText={(v) => updatePet(idx, { insurancePremium: v })}
            numeric
            placeholder={t('onboarding.pets.q10a.insurancePremiumPlaceholder')}
            large
            inGroup
            currency={currency}
          />
        </InputGroup>
        <Text style={{ fontSize: 13, color: C.primary, fontWeight: '600', marginBottom: 6 }}>
          {t('onboarding.pets.q10a.insuranceRenewalLabel')}
        </Text>
        <DatePicker
          value={pet.insuranceRenewalDate}
          onChange={(v) => updatePet(idx, { insuranceRenewalDate: v })}
        />
      </AnimatedSlideIn>

      {/* Spacing between insurance and dog tax */}
      <View style={{ height: 12 }} />

      {/* Dog-specific: dog tax (CZ) */}
      {pet.type === 'dog' && (
        <View style={{ padding: 12, backgroundColor: C.chipSelectedBg, borderRadius: 8, borderWidth: 1, borderColor: C.border, marginBottom: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={{ fontSize: 13, color: C.primary, fontWeight: '500' }}>
              {t('onboarding.pets.q10a.dogTaxLabel')}
            </Text>
            <Pressable
              onPress={() => updatePet(idx, { dogTax: !pet.dogTax })}
              style={{
                paddingVertical: 4, paddingHorizontal: 12, borderRadius: 6,
                backgroundColor: pet.dogTax ? C.chipSelectedBg : C.bg,
              }}
            >
              <Text style={{ fontSize: 12, color: pet.dogTax ? C.primary : C.muted, fontWeight: '500' }}>
                {pet.dogTax ? t('common.yes') : t('common.no')}
              </Text>
            </Pressable>
          </View>
          <AnimatedSlideIn visible={pet.dogTax}>
            <InputGroup label={t('onboarding.pets.q10a.dogTaxLabel')}>
              <LabeledInput
                value={pet.dogTaxAmount}
                onChangeText={(v) => updatePet(idx, { dogTaxAmount: v })}
                numeric
                placeholder="1 500"
                large
                inGroup
                currency={currency}
              />
            </InputGroup>
            <Text style={{ ...T.caption, color: C.muted, marginTop: 4 }}>{t('onboarding.pets.q10a.dogTaxHelper')}</Text>
          </AnimatedSlideIn>
        </View>
      )}
    </View>
  );

  const renderQ10a = () => {
    if (!currentPet) return null;

    return (
      <View>
        {/* Stepper indicator */}
        {pets.length > 1 && (
          <View style={{ flexDirection: 'row', borderRadius: R.input, borderWidth: 1, borderColor: C.border, overflow: 'hidden', marginBottom: 16 }}>
            {pets.map((pet, idx) => (
              <AnimatedRow
                key={pet.id || idx}
                visible={pet.visible !== false}
                style={{ flex: 1, marginBottom: 0 }}
                onAnimationEnd={() => {
                  if (pet.visible === false) finalizeRemovePet(idx);
                }}
              >
                <Pressable
                  onPress={() => { setPetIndex(idx); setValidationError(''); }}
                  style={{
                    flex: 1,
                    paddingVertical: 10,
                    backgroundColor: petIndex === idx ? C.chipSelectedBg : 'transparent',
                    alignItems: 'center',
                  }}
                >
                  <Text style={{
                    fontSize: 13,
                    fontWeight: '500',
                    color: petIndex === idx ? C.primary : C.muted,
                  }}>
                    {pet.name || t('onboarding.pets.q10a.petLabel', { n: String(idx + 1) })}
                  </Text>
                </Pressable>
              </AnimatedRow>
            ))}
          </View>
        )}

        <Text style={{ ...T.helper, color: C.muted, marginBottom: 16 }}>
          {t('onboarding.pets.q10a.helper')}
        </Text>

        <ScrollFocusAnchor focusId={currentPet.id} focusToken={focusToken}>
          <AnimatedRow
            visible={currentPet.visible !== false}
            onAnimationEnd={() => {
              if (currentPet.visible === false) finalizeRemovePet(petIndex);
            }}
          >
            {renderPetForm(currentPet, petIndex)}
          </AnimatedRow>
        </ScrollFocusAnchor>

        <AddAnotherButton
          label={t('onboarding.pets.q10a.addPet')}
          onPress={addPet}
          style={{ marginTop: 8, width: '100%', alignSelf: 'stretch' }}
        />
      </View>
    );
  };

  const stepTitles = {
    q10: t('onboarding.pets.q10.title'),
    q10a: t('onboarding.pets.q10a.heading'),
  };

  return (
    <QuestionScreen
      chapter={t('onboarding.pets.chapter')}
      title={stepTitles[step]}
      onContinue={handleContinue}
      onBack={handleBack}
      validationError={validationError}
      progress={screenProgress}
      continueLabel={editContinueLabel}
      animationKey={step}
    >
      {step === 'q10' && renderQ10()}
      {step === 'q10a' && renderQ10a()}
    </QuestionScreen>
  );
}
