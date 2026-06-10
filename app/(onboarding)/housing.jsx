import { useState, useEffect, useRef } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useI18n } from '../../lib/i18n';
import { getData, setData } from '../../lib/storage';
import { getCurrencySymbol } from '../../lib/currency';
import { formatCurrency } from '../../lib/finance';
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
import CostCard from '../../components/onboarding/CostCard';
import InputGroup from '../../components/onboarding/InputGroup';
import ScrollFocusAnchor from '../../components/onboarding/ScrollFocusAnchor';
import { useSectionExit } from '../../lib/finishOnboardingSection';
import {
  buildWasteTaxMemberSummary,
  estimateAnnualWasteTax,
  shouldEstimateCzechWasteTax,
} from '../../lib/wasteTax';

const UTILITY_KEYS = ['water', 'hotWater', 'heating', 'electricity', 'gas', 'sewer', 'garbage'];

const EMPTY_UTILITY_BREAKDOWN = Object.fromEntries(UTILITY_KEYS.map((k) => [k, '']));

function computeItemizedUtilitiesSum(breakdown, otherRows) {
  const fixedTotal = Object.values(breakdown).reduce((sum, v) => sum + (parseFloat(v) || 0), 0);
  const otherTotal = (otherRows || [])
    .filter((row) => row.visible !== false)
    .reduce((sum, row) => sum + (parseFloat(row.amount) || 0), 0);
  return fixedTotal + otherTotal;
}

/**
 * Q6 — Housing type (renting / own / family)
 * Q6a — Monthly rent (renting)
 * Q6b — Utilities (renting)
 * Q6c — Internet (all)
 * Q6d — Mortgage toggle (own)
 * Q6e — Mortgage payment (mortgage)
 * Q6f — Other ownership costs (own)
 * Q6h — Family contribution (family)
 * Q6g — Government & city taxes (all)
 */
export default function HousingScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const { isEditMode, completeSection, leaveSection, editContinueLabel } = useSectionExit();

  // ── Loaded data ──
  const [currencyCode, setCurrencyCode] = useState('CZK');
  const currency = getCurrencySymbol(currencyCode);

  // ── Step tracking ──
  const [step, setStep] = useState('q6');

  // ── Q6: Housing type ──
  const [housingType, setHousingType] = useState(null); // 'renting' | 'own' | 'family'

  // ── Q6a: Monthly rent ──
  const [rentAmount, setRentAmount] = useState('');

  // ── Q6b: Utilities ──
  const [utilitiesMode, setUtilitiesMode] = useState('total'); // 'total' | 'itemized'
  const [utilitiesAmount, setUtilitiesAmount] = useState('');
  const [utilityBreakdown, setUtilityBreakdown] = useState({ ...EMPTY_UTILITY_BREAKDOWN });
  const [utilityOtherRows, setUtilityOtherRows] = useState([]);
  const nextUtilityOtherId = useRef(0);

  // ── Q6c: Internet ──
  const [hasInternet, setHasInternet] = useState(null); // null | true | false
  const [internetAmount, setInternetAmount] = useState('');
  const [internetFrequency, setInternetFrequency] = useState('monthly');

  // ── Q6d: Mortgage toggle ──
  const [hasMortgage, setHasMortgage] = useState(null); // null | true | false

  // ── Q6e: Mortgage payment ──
  const [mortgageAmount, setMortgageAmount] = useState('');
  const [mortgageEndDate, setMortgageEndDate] = useState('');

  // ── Q6f: Other ownership costs ──
  const [hasOtherCosts, setHasOtherCosts] = useState(null); // null | true | false
  const [otherCostRows, setOtherCostRows] = useState([
    { id: 0, amount: '', description: '', dueDate: '', visible: true },
  ]);
  const nextCostRowId = useRef(1);

  // ── Q6h: Family contribution ──
  const [contributesToFamily, setContributesToFamily] = useState(null); // null | true | false
  const [familyContributionRows, setFamilyContributionRows] = useState([
    { id: 0, amount: '', description: '', dueDate: '', visible: true },
  ]);
  const nextFamilyRowId = useRef(1);

  // ── Q6g: Government taxes ──
  const [household, setHousehold] = useState(null);
  const [location, setLocation] = useState(null);
  const [wasteTax, setWasteTax] = useState(true);
  const [wasteTaxAmount, setWasteTaxAmount] = useState('1080');
  const [wasteTaxUserEdited, setWasteTaxUserEdited] = useState(false);
  const [tvLicence, setTvLicence] = useState(true);
  const [tvLicenceAmount, setTvLicenceAmount] = useState('1620');
  const [radioLicence, setRadioLicence] = useState(true);
  const [radioLicenceAmount, setRadioLicenceAmount] = useState('540');
  const [customTaxItems, setCustomTaxItems] = useState([]);
  const nextTaxItemId = useRef(0);
  const [focusToken, setFocusToken] = useState(null);

  // ── Validation ──
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    async function loadData() {
      const loc = await getData('pocketos_location');
      if (loc?.currency) setCurrencyCode(loc.currency);
      setLocation(loc || null);

      const hh = await getData('pocketos_household');
      setHousehold(hh || null);

      const saved = await getData('pocketos_housing');
      if (saved) {
        if (saved.type) setHousingType(saved.type);
        if (saved.rent) setRentAmount(String(saved.rent));
        if (saved.utilitiesMode) setUtilitiesMode(saved.utilitiesMode);
        if (saved.utilities) setUtilitiesAmount(String(saved.utilities));
        if (saved.utilityBreakdown) {
          const fixedOnly = { ...EMPTY_UTILITY_BREAKDOWN };
          UTILITY_KEYS.forEach((key) => {
            if (saved.utilityBreakdown[key] != null) {
              fixedOnly[key] = String(saved.utilityBreakdown[key]);
            }
          });
          setUtilityBreakdown(fixedOnly);
        }
        if (saved.utilityOtherRows?.length) {
          const restored = saved.utilityOtherRows.map((row, i) => ({
            id: i,
            label: row.label || '',
            amount: row.amount != null ? String(row.amount) : '',
            visible: true,
          }));
          setUtilityOtherRows(restored);
          nextUtilityOtherId.current = restored.length;
        }
        if (saved.hasInternet !== undefined) setHasInternet(saved.hasInternet);
        if (saved.internetAmount) setInternetAmount(String(saved.internetAmount));
        if (saved.internetFrequency) setInternetFrequency(saved.internetFrequency);
        if (saved.hasMortgage !== undefined) setHasMortgage(saved.hasMortgage);
        if (saved.mortgageAmount) setMortgageAmount(String(saved.mortgageAmount));
        if (saved.mortgageEndDate) setMortgageEndDate(saved.mortgageEndDate);
        if (saved.hasOtherCosts !== undefined) setHasOtherCosts(saved.hasOtherCosts);
        if (saved.otherCostRows) {
          setOtherCostRows(saved.otherCostRows.map((r, i) => ({ ...r, id: i, visible: true })));
          nextCostRowId.current = saved.otherCostRows.length;
        }
        if (saved.contributesToFamily !== undefined) setContributesToFamily(saved.contributesToFamily);
        if (saved.familyContributionRows) {
          setFamilyContributionRows(saved.familyContributionRows.map((r, i) => ({ ...r, id: i, visible: true })));
          nextFamilyRowId.current = saved.familyContributionRows.length;
        }
        if (saved.govtTaxes) {
          const userEdited = saved.govtTaxes.wasteTaxUserEdited === true;
          setWasteTaxUserEdited(userEdited);
          setWasteTax(saved.govtTaxes.wasteTax ?? true);
          if (userEdited && saved.govtTaxes.wasteTaxAmount != null) {
            setWasteTaxAmount(String(saved.govtTaxes.wasteTaxAmount));
          } else if (shouldEstimateCzechWasteTax(loc)) {
            setWasteTaxAmount(String(estimateAnnualWasteTax(hh)));
          } else if (saved.govtTaxes.wasteTaxAmount != null) {
            setWasteTaxAmount(String(saved.govtTaxes.wasteTaxAmount));
          }
          setTvLicence(saved.govtTaxes.tvLicence ?? true);
          setTvLicenceAmount(saved.govtTaxes.tvLicenceAmount != null ? String(saved.govtTaxes.tvLicenceAmount) : '1620');
          setRadioLicence(saved.govtTaxes.radioLicence ?? true);
          setRadioLicenceAmount(saved.govtTaxes.radioLicenceAmount != null ? String(saved.govtTaxes.radioLicenceAmount) : '540');
          if (saved.govtTaxes.customItems) {
            setCustomTaxItems(saved.govtTaxes.customItems.map((item, i) => ({ ...item, id: i, visible: true, frequency: item.frequency || 'annual' })));
            nextTaxItemId.current = saved.govtTaxes.customItems.length;
          }
        }
      } else if (shouldEstimateCzechWasteTax(loc)) {
        setWasteTaxAmount(String(estimateAnnualWasteTax(hh)));
      }

      if (isEditMode) setStep('q6');
    }
    loadData();
  }, [isEditMode]);

  const handleContinue = async () => {
    setValidationError('');

    if (isEditMode) {
      await saveAll();
      return;
    }

    if (step === 'q6') {
      if (!housingType) {
        setValidationError(t('onboarding.housing.q6.validation'));
        return;
      }
      if (housingType === 'renting') setStep('q6a');
      else if (housingType === 'own') setStep('q6d');
      else setStep('q6h');
    } else if (step === 'q6a') {
      if (!rentAmount) {
        setValidationError(t('onboarding.housing.q6a.validation'));
        return;
      }
      setStep('q6b');
    } else if (step === 'q6b') {
      setStep('q6c');
    } else if (step === 'q6c') {
      if (hasInternet === true && !internetAmount) {
        setValidationError(t('onboarding.housing.q6c.validation'));
        return;
      }
      setStep('q6g');
    } else if (step === 'q6d') {
      if (hasMortgage === null) {
        setValidationError(t('onboarding.housing.q6d.validation'));
        return;
      }
      if (hasMortgage) setStep('q6e');
      else setStep('q6f');
    } else if (step === 'q6e') {
      if (!mortgageAmount) {
        setValidationError(t('onboarding.housing.q6e.validation'));
        return;
      }
      setStep('q6f');
    } else if (step === 'q6f') {
      setStep('q6c');
    } else if (step === 'q6h') {
      setStep('q6c');
    } else if (step === 'q6g') {
      await saveAll();
    }
  };

  const saveAll = async () => {
    const housingData = {
      type: housingType,
      rent: rentAmount ? parseFloat(rentAmount) : null,
      utilitiesMode,
      utilities: utilitiesMode === 'total'
        ? (utilitiesAmount ? parseFloat(utilitiesAmount) : null)
        : computeItemizedUtilitiesSum(utilityBreakdown, utilityOtherRows) || null,
      utilityBreakdown: utilitiesMode === 'itemized'
        ? Object.fromEntries(
          Object.entries(utilityBreakdown).map(([key, value]) => [
            key,
            value ? parseFloat(value) : null,
          ]),
        )
        : null,
      utilityOtherRows: utilitiesMode === 'itemized'
        ? utilityOtherRows
          .filter((row) => row.visible !== false)
          .map((row) => ({
            label: row.label || null,
            amount: row.amount ? parseFloat(row.amount) : null,
          }))
        : [],
      hasInternet,
      internetAmount: hasInternet && internetAmount ? parseFloat(internetAmount) : null,
      internetFrequency: hasInternet ? internetFrequency : null,
      hasMortgage,
      mortgageAmount: hasMortgage && mortgageAmount ? parseFloat(mortgageAmount) : null,
      mortgageEndDate: hasMortgage ? mortgageEndDate : null,
      hasOtherCosts,
      otherCostRows: hasOtherCosts ? otherCostRows.map(r => ({
        amount: r.amount ? parseFloat(r.amount) : null,
        description: r.description || null,
        dueDate: r.dueDate || null,
      })) : [],
      contributesToFamily: housingType === 'family' ? contributesToFamily : false,
      familyContributionRows: housingType === 'family' && contributesToFamily === true
        ? familyContributionRows
          .filter((r) => r.visible !== false)
          .map(r => ({
            amount: r.amount ? parseFloat(r.amount) : null,
            description: r.description || null,
            dueDate: r.dueDate || null,
          }))
        : [],
      govtTaxes: {
        wasteTax,
        wasteTaxAmount: wasteTax ? parseFloat(wasteTaxAmount) : null,
        wasteTaxUserEdited,
        wasteTaxEstimatedAmount: shouldEstimateCzechWasteTax(location)
          ? estimateAnnualWasteTax(household)
          : null,
        tvLicence,
        tvLicenceAmount: tvLicence ? parseFloat(tvLicenceAmount) : null,
        radioLicence,
        radioLicenceAmount: radioLicence ? parseFloat(radioLicenceAmount) : null,
        customItems: customTaxItems.map(item => ({
          name: item.name,
          amount: item.amount ? parseFloat(item.amount) : null,
          frequency: item.frequency || 'annual',
        })),
      },
    };

    await completeSection({
      persist: async () => { await setData('pocketos_housing', housingData); },
      onboardingPatch: { completed: false, currentStep: 'housing', percentComplete: 65 },
      nextRoute: '/(onboarding)/splash-transport',
    });
  };

  const handleBack = () => {
    setValidationError('');
    if (step === 'q6a') { setStep('q6'); return; }
    if (step === 'q6b') { setStep('q6a'); return; }
    if (step === 'q6c') {
      if (housingType === 'renting') { setStep('q6b'); return; }
      if (housingType === 'own') { setStep('q6f'); return; }
      if (housingType === 'family') { setStep('q6h'); return; }
    }
    if (step === 'q6d') { setStep('q6'); return; }
    if (step === 'q6e') { setStep('q6d'); return; }
    if (step === 'q6f') {
      if (hasMortgage) { setStep('q6e'); return; }
      setStep('q6d');
      return;
    }
    if (step === 'q6h') { setStep('q6'); return; }
    if (step === 'q6g') {
      // Go back to Q6c
      setStep('q6c');
      return;
    }
    leaveSection(() => router.replace('/(onboarding)/splash-housing'));
  };

  // ── Helpers for repeating rows ──
  const addCostRow = () => {
    const id = nextCostRowId.current++;
    setOtherCostRows([...otherCostRows, { id, amount: '', description: '', dueDate: '', visible: true }]);
    setFocusToken(String(id));
  };

  const updateCostRow = (index, field, value) => {
    const rows = [...otherCostRows];
    rows[index] = { ...rows[index], [field]: value };
    setOtherCostRows(rows);
  };

  const removeCostRow = (id) => {
    if (otherCostRows.length <= 1) return;
    setOtherCostRows(otherCostRows.map(r => r.id === id ? { ...r, visible: false } : r));
  };

  const finalizeRemoveCost = (id) => {
    setOtherCostRows((prev) => prev.filter(r => r.id !== id));
  };

  const addFamilyRow = () => {
    const id = nextFamilyRowId.current++;
    setFamilyContributionRows([...familyContributionRows, { id, amount: '', description: '', dueDate: '', visible: true }]);
    setFocusToken(String(id));
  };

  const updateFamilyRow = (index, field, value) => {
    const rows = [...familyContributionRows];
    rows[index] = { ...rows[index], [field]: value };
    setFamilyContributionRows(rows);
  };

  const removeFamilyRow = (id) => {
    if (familyContributionRows.length <= 1) return;
    setFamilyContributionRows(familyContributionRows.map(r => r.id === id ? { ...r, visible: false } : r));
  };

  const finalizeRemoveFamily = (id) => {
    setFamilyContributionRows((prev) => prev.filter(r => r.id !== id));
  };

  const addUtilityOtherRow = () => {
    const id = nextUtilityOtherId.current++;
    setUtilityOtherRows((prev) => [...prev, { id, label: '', amount: '', visible: true }]);
    setFocusToken(`utility-${id}`);
  };

  const updateUtilityOtherRow = (index, field, value) => {
    setUtilityOtherRows((prev) => {
      const rows = [...prev];
      rows[index] = { ...rows[index], [field]: value };
      return rows;
    });
  };

  const removeUtilityOtherRow = (id) => {
    setUtilityOtherRows((prev) => prev.map((row) => (
      row.id === id ? { ...row, visible: false } : row
    )));
  };

  const finalizeRemoveUtilityOther = (id) => {
    setUtilityOtherRows((prev) => prev.filter((row) => row.id !== id));
  };

  const addCustomTaxItem = () => {
    const id = nextTaxItemId.current++;
    setCustomTaxItems([...customTaxItems, { id, name: '', amount: '', frequency: 'annual', visible: true }]);
    setFocusToken(String(id));
  };

  const updateCustomTaxItem = (index, field, value) => {
    const items = [...customTaxItems];
    items[index] = { ...items[index], [field]: value };
    setCustomTaxItems(items);
  };

  const removeCustomTaxItem = (id) => {
    setCustomTaxItems(customTaxItems.map(item => item.id === id ? { ...item, visible: false } : item));
  };

  const finalizeRemoveTaxItem = (id) => {
    setCustomTaxItems((prev) => prev.filter(item => item.id !== id));
  };

  // ── Progress calculation ──
  const progressMap = { q6: 56, q6a: 57, q6b: 58, q6c: 59, q6d: 57, q6e: 58, q6f: 59, q6h: 57, q6g: 62 };
  const progress = progressMap[step] || 56;
  const screenProgress = isEditMode ? undefined : progress;

  // ── Q6: Housing type ──
  if (step === 'q6') {
    const options = [
      { key: 'renting', emoji: '🏢' },
      { key: 'own', emoji: '🏠' },
      { key: 'family', emoji: '👨‍👩‍👧' },
    ];

    return (
      <QuestionScreen
        animationKey={step}
        chapter={t('onboarding.housing.chapter')}
        title={t('onboarding.housing.q6.title')}
        helper={t('onboarding.housing.q6.helper')}
        onContinue={handleContinue}
        onBack={handleBack}
        validationError={validationError}
        progress={screenProgress}
        continueLabel={editContinueLabel}
      >
        <View style={{ gap: 0 }}>
          {options.map((opt) => (
            <OptionCard
              key={opt.key}
              icon={opt.emoji}
              label={t(`onboarding.housing.q6.${opt.key}`)}
              selected={housingType === opt.key}
              onPress={() => setHousingType(opt.key)}
            />
          ))}
        </View>
      </QuestionScreen>
    );
  }

  // ── Q6a: Monthly rent ──
  if (step === 'q6a') {
    return (
      <QuestionScreen
        animationKey={step}
        chapter={t('onboarding.housing.chapter')}
        title={t('onboarding.housing.q6a.title')}
        helper={t('onboarding.housing.q6a.helper')}
        onContinue={handleContinue}
        onBack={handleBack}
        validationError={validationError}
        progress={screenProgress}
        continueLabel={editContinueLabel}
      >
        <InputGroup label={t('onboarding.housing.q6a.amountLabel')}>
          <LabeledInput
            value={rentAmount}
            onChangeText={setRentAmount}
            numeric
            placeholder="0"
            large
            inGroup
            currency={currency}
          />
        </InputGroup>
      </QuestionScreen>
    );
  }

  // ── Q6b: Utilities ──
  if (step === 'q6b') {
    const utilitiesSum = computeItemizedUtilitiesSum(utilityBreakdown, utilityOtherRows);

    return (
      <QuestionScreen
        animationKey={step}
        chapter={t('onboarding.housing.chapter')}
        title={t('onboarding.housing.q6b.title')}
        helper={t('onboarding.housing.q6b.helper')}
        onContinue={handleContinue}
        onBack={handleBack}
        validationError={validationError}
        progress={screenProgress}
        continueLabel={editContinueLabel}
      >
        <Text style={{ ...T.fieldLabel, marginBottom: S.labelGap }}>
          {t('onboarding.housing.q6b.modeLabel')}
        </Text>
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
          <OptionCard
            label={t('onboarding.housing.q6b.modeTotal')}
            selected={utilitiesMode === 'total'}
            onPress={() => setUtilitiesMode('total')}
            style={{ flex: 1 }}
          />
          <OptionCard
            label={t('onboarding.housing.q6b.modeItemized')}
            selected={utilitiesMode === 'itemized'}
            onPress={() => setUtilitiesMode('itemized')}
            style={{ flex: 1 }}
          />
        </View>

        <AnimatedSlideIn visible={utilitiesMode === 'total'}>
          <InputGroup label={t('onboarding.housing.q6b.amountLabel')}>
            <LabeledInput
              value={utilitiesAmount}
              onChangeText={setUtilitiesAmount}
              numeric
              placeholder="0"
              large
              inGroup
              currency={currency}
            />
          </InputGroup>
        </AnimatedSlideIn>

        <AnimatedSlideIn visible={utilitiesMode === 'itemized'}>
          <InputGroup>
            {UTILITY_KEYS.map((key) => (
              <LabeledInput
                key={key}
                label={t(`onboarding.housing.q6b.utility${key.charAt(0).toUpperCase()}${key.slice(1)}`)}
                value={utilityBreakdown[key]}
                onChangeText={(v) => setUtilityBreakdown((prev) => ({ ...prev, [key]: v }))}
                numeric
                placeholder="0"
                inCard
                currency={currency}
              />
            ))}

            <AddAnotherButton
              label={`+ ${t('onboarding.housing.q6b.addOtherUtility')}`}
              onPress={addUtilityOtherRow}
            />

            {utilityOtherRows.map((row, index) => (
              <ScrollFocusAnchor key={row.id} focusId={`utility-${row.id}`} focusToken={focusToken}>
                <AnimatedRow
                  visible={row.visible}
                  onAnimationEnd={() => {
                    if (!row.visible) finalizeRemoveUtilityOther(row.id);
                  }}
                >
                  <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-end' }}>
                    <LabeledInput
                      label={t('onboarding.housing.q6b.otherUtilityLabel')}
                      value={row.label}
                      onChangeText={(v) => updateUtilityOtherRow(index, 'label', v)}
                      placeholder={t('onboarding.housing.q6b.otherUtilityPlaceholder')}
                      inCard
                      containerStyle={{ flex: 1, marginBottom: 0 }}
                    />
                    <LabeledInput
                      label={t('onboarding.housing.q6b.otherUtilityAmount')}
                      value={row.amount}
                      onChangeText={(v) => updateUtilityOtherRow(index, 'amount', v)}
                      numeric
                      placeholder="0"
                      inCard
                      currency={currency}
                      containerStyle={{ flex: 1, marginBottom: 0 }}
                    />
                    <RemoveButton onPress={() => removeUtilityOtherRow(row.id)} />
                  </View>
                </AnimatedRow>
              </ScrollFocusAnchor>
            ))}

            <Pressable
              disabled
              style={{
                marginTop: 8,
                paddingVertical: 12,
                paddingHorizontal: 16,
                borderRadius: R.input,
                backgroundColor: C.bg,
                borderWidth: 1,
                borderColor: C.border,
                alignItems: 'center',
                opacity: 0.85,
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: '600', color: C.muted }}>
                {t('onboarding.housing.q6b.utilitiesSum', {
                  amount: formatCurrency(utilitiesSum, currency),
                })}
              </Text>
            </Pressable>
          </InputGroup>
        </AnimatedSlideIn>

        <Pressable
          onPress={() => {
            setUtilitiesAmount('');
            setUtilityBreakdown({ ...EMPTY_UTILITY_BREAKDOWN });
            setStep('q6c');
          }}
          style={({ pressed }) => ({
            marginTop: 16,
            paddingVertical: 12,
            borderRadius: R.input,
            borderWidth: 1.5,
            borderColor: C.addBorder,
            borderStyle: 'dashed',
            alignItems: 'center',
            backgroundColor: pressed ? C.addPressed : 'transparent',
          })}
        >
          <Text style={{ ...T.btnAdd, color: C.addText }}>
            {t('onboarding.housing.q6b.skip')}
          </Text>
        </Pressable>
      </QuestionScreen>
    );
  }

  // ── Q6c: Internet ──
  if (step === 'q6c') {
    return (
      <QuestionScreen
        animationKey={step}
        chapter={t('onboarding.housing.chapter')}
        title={t('onboarding.housing.q6c.title')}
        helper={t('onboarding.housing.q6c.helper')}
        onContinue={handleContinue}
        onBack={handleBack}
        validationError={validationError}
        progress={screenProgress}
        continueLabel={editContinueLabel}
      >
        <YesNoToggle
          value={hasInternet}
          onChange={setHasInternet}
          yesLabel={t('onboarding.housing.q6c.yes')}
          noLabel={t('onboarding.housing.q6c.no')}
        />

        <AnimatedSlideIn visible={hasInternet === true}>
          <InputGroup label={t('onboarding.housing.q6c.amountLabel')}>
            <LabeledInput
              value={internetAmount}
              onChangeText={setInternetAmount}
              numeric
              placeholder={t('onboarding.housing.q6c.amountPlaceholder')}
              large
              inGroup
              currency={currency}
            />
            <FrequencyPills
              options={['monthly', 'annual']}
              value={internetFrequency}
              onChange={setInternetFrequency}
              labelMap={{
                monthly: t('onboarding.housing.q6c.frequencyMonthly'),
                annual: t('onboarding.housing.q6c.frequencyAnnual'),
              }}
            />
          </InputGroup>
        </AnimatedSlideIn>
      </QuestionScreen>
    );
  }

  // ── Q6d: Mortgage toggle ──
  if (step === 'q6d') {
    return (
      <QuestionScreen
        animationKey={step}
        chapter={t('onboarding.housing.chapter')}
        title={t('onboarding.housing.q6d.title')}
        helper={t('onboarding.housing.q6d.helper')}
        onContinue={handleContinue}
        onBack={handleBack}
        validationError={validationError}
        progress={screenProgress}
        continueLabel={editContinueLabel}
      >
        <YesNoToggle
          value={hasMortgage}
          onChange={setHasMortgage}
          yesLabel={t('onboarding.housing.q6d.yes')}
          noLabel={t('onboarding.housing.q6d.no')}
        />
      </QuestionScreen>
    );
  }

  // ── Q6e: Mortgage payment ──
  if (step === 'q6e') {
    return (
      <QuestionScreen
        animationKey={step}
        chapter={t('onboarding.housing.chapter')}
        title={t('onboarding.housing.q6e.title')}
        helper={t('onboarding.housing.q6e.helper')}
        onContinue={handleContinue}
        onBack={handleBack}
        validationError={validationError}
        progress={screenProgress}
        continueLabel={editContinueLabel}
      >
        <InputGroup label={t('onboarding.housing.q6e.amountLabel')}>
          <LabeledInput
            value={mortgageAmount}
            onChangeText={setMortgageAmount}
            numeric
            placeholder="0"
            large
            inGroup
            currency={currency}
          />
        </InputGroup>

        {/* Mortgage end date (optional) */}
        <View>
          <Text style={{
            ...T.fieldLabel,
            color: C.muted,
            marginBottom: S.labelGap,
          }}>
            {t('onboarding.housing.q6e.endDateLabel')}
          </Text>
          <DatePicker
            value={mortgageEndDate}
            onChange={setMortgageEndDate}
            showDay={false}
          />
        </View>
      </QuestionScreen>
    );
  }

  // ── Q6f: Other ownership costs ──
  if (step === 'q6f') {
    return (
      <QuestionScreen
        animationKey={step}
        chapter={t('onboarding.housing.chapter')}
        title={t('onboarding.housing.q6f.title')}
        helper={t('onboarding.housing.q6f.helper')}
        onContinue={handleContinue}
        onBack={handleBack}
        validationError={validationError}
        progress={screenProgress}
        continueLabel={editContinueLabel}
      >
        <YesNoToggle
          value={hasOtherCosts}
          onChange={setHasOtherCosts}
          yesLabel={t('onboarding.housing.q6f.yes')}
          noLabel={t('onboarding.housing.q6f.no')}
        />

        <AnimatedSlideIn visible={hasOtherCosts === true}>
          {otherCostRows.map((row, index) => (
            <ScrollFocusAnchor key={row.id} focusId={String(row.id)} focusToken={focusToken}>
            <AnimatedRow
              visible={row.visible}
              onAnimationEnd={() => {
                if (!row.visible) finalizeRemoveCost(row.id);
              }}
            >
              <View style={{
                backgroundColor: C.surface,
                borderWidth: 1,
                borderColor: C.border,
                borderRadius: R.card,
                padding: S.cardPad,
              }}>
                {/* Amount + remove */}
                <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 10 }}>
                  <LabeledInput
                    label={t('onboarding.housing.q6f.amountLabel')}
                    value={row.amount}
                    onChangeText={(v) => updateCostRow(index, 'amount', v)}
                    numeric
                    placeholder={t('onboarding.housing.q6f.amountPlaceholder')}
                    large
                    containerStyle={{ flex: 1, marginBottom: 0 }}
                    currency={currency}
                  />
                  {otherCostRows.length > 1 && (
                    <View style={{ height: 63, justifyContent: 'center' }}>
                      <Pressable onPress={() => removeCostRow(row.id)} style={{ padding: 8 }}>
                        <Text style={{ fontSize: 18, color: C.danger }}>✕</Text>
                      </Pressable>
                    </View>
                  )}
                </View>

                {/* Description */}
                <LabeledInput
                  label={t('onboarding.housing.q6f.descriptionPlaceholder')}
                  value={row.description}
                  onChangeText={(v) => updateCostRow(index, 'description', v)}
                  placeholder={t('onboarding.housing.q6f.descriptionPlaceholder')}
                  inCard
                  containerStyle={{ marginBottom: 10 }}
                />

                {/* Due date */}
                <Text style={{ ...T.fieldLabel, color: C.muted, marginBottom: S.labelGap }}>
                  {t('onboarding.housing.q6f.dueDateLabel')}
                </Text>
                <DatePicker
                  value={row.dueDate}
                  onChange={(v) => updateCostRow(index, 'dueDate', v)}
                  showDay={false}
                />
              </View>
            </AnimatedRow>
            </ScrollFocusAnchor>
          ))}

          <AddAnotherButton
            label={t('onboarding.housing.q6f.addAnother')}
            onPress={addCostRow}
          />
        </AnimatedSlideIn>
      </QuestionScreen>
    );
  }

  // ── Q6h: Family contribution ──
  if (step === 'q6h') {
    return (
      <QuestionScreen
        animationKey={step}
        chapter={t('onboarding.housing.chapter')}
        title={t('onboarding.housing.q6h.title')}
        helper={t('onboarding.housing.q6h.helper')}
        onContinue={handleContinue}
        onBack={handleBack}
        validationError={validationError}
        progress={screenProgress}
        continueLabel={editContinueLabel}
      >
        <YesNoToggle
          value={contributesToFamily}
          onChange={setContributesToFamily}
          yesLabel={t('onboarding.housing.q6h.yes')}
          noLabel={t('onboarding.housing.q6h.no')}
        />

        <AnimatedSlideIn visible={contributesToFamily === true}>
          {familyContributionRows.map((row, index) => (
            <ScrollFocusAnchor key={row.id} focusId={String(row.id)} focusToken={focusToken}>
            <AnimatedRow
              visible={row.visible}
              onAnimationEnd={() => {
                if (!row.visible) finalizeRemoveFamily(row.id);
              }}
            >
              <View style={{
                backgroundColor: C.surface,
                borderWidth: 1,
                borderColor: C.border,
                borderRadius: R.card,
                padding: S.cardPad,
              }}>
                {/* Amount + remove */}
                <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 10 }}>
                  <LabeledInput
                    label={t('onboarding.housing.q6h.amountLabel')}
                    value={row.amount}
                    onChangeText={(v) => updateFamilyRow(index, 'amount', v)}
                    numeric
                    placeholder={t('onboarding.housing.q6h.amountPlaceholder')}
                    large
                    containerStyle={{ flex: 1, marginBottom: 0 }}
                    currency={currency}
                  />
                  {familyContributionRows.length > 1 && (
                    <View style={{ height: 63, justifyContent: 'center' }}>
                      <Pressable onPress={() => removeFamilyRow(row.id)} style={{ padding: 8 }}>
                        <Text style={{ fontSize: 18, color: C.danger }}>✕</Text>
                      </Pressable>
                    </View>
                  )}
                </View>

                {/* Description */}
                <LabeledInput
                  label={t('onboarding.housing.q6h.descriptionPlaceholder')}
                  value={row.description}
                  onChangeText={(v) => updateFamilyRow(index, 'description', v)}
                  placeholder={t('onboarding.housing.q6h.descriptionPlaceholder')}
                  inCard
                  containerStyle={{ marginBottom: 10 }}
                />

                {/* Due date */}
                <Text style={{ ...T.fieldLabel, color: C.muted, marginBottom: S.labelGap }}>
                  {t('onboarding.housing.q6h.dueDateLabel')}
                </Text>
                <DatePicker
                  value={row.dueDate}
                  onChange={(v) => updateFamilyRow(index, 'dueDate', v)}
                  showDay={false}
                />
              </View>
            </AnimatedRow>
            </ScrollFocusAnchor>
          ))}

          <AddAnotherButton
            label={t('onboarding.housing.q6h.addAnother')}
            onPress={addFamilyRow}
          />
        </AnimatedSlideIn>
      </QuestionScreen>
    );
  }

  const handleWasteTaxAmountChange = (value) => {
    setWasteTaxAmount(value);
    setWasteTaxUserEdited(true);
  };

  const getWasteTaxNote = () => {
    const amountLabel = formatCurrency(parseFloat(wasteTaxAmount) || 0, currency);
    if (shouldEstimateCzechWasteTax(location) && household) {
      return t('onboarding.housing.q6g.wasteTaxNoteEstimated', {
        amount: amountLabel,
        summary: buildWasteTaxMemberSummary(household, t),
      });
    }
    return t('onboarding.housing.q6g.wasteTaxNote', { amount: amountLabel });
  };

  // ── Q6g: Government & city taxes ──
  if (step === 'q6g') {
    const govtChargeItems = [
      {
        key: 'wasteTax',
        labelKey: 'wasteTax',
        dontPayKey: 'dontPayWasteTax',
        enabled: wasteTax,
        setEnabled: setWasteTax,
        amount: wasteTaxAmount,
        setAmount: handleWasteTaxAmountChange,
        getNote: getWasteTaxNote,
      },
      {
        key: 'tvLicence',
        labelKey: 'tvLicence',
        noteKey: 'tvLicenceNote',
        dontPayKey: 'dontPayTvLicence',
        enabled: tvLicence,
        setEnabled: setTvLicence,
        amount: tvLicenceAmount,
        setAmount: setTvLicenceAmount,
      },
      {
        key: 'radioLicence',
        labelKey: 'radioLicence',
        noteKey: 'radioLicenceNote',
        dontPayKey: 'dontPayRadioLicence',
        enabled: radioLicence,
        setEnabled: setRadioLicence,
        amount: radioLicenceAmount,
        setAmount: setRadioLicenceAmount,
      },
    ];

    return (
      <QuestionScreen
        animationKey={step}
        chapter={t('onboarding.housing.chapter')}
        title={t('onboarding.housing.q6g.title')}
        helper={t('onboarding.housing.q6g.helper')}
        onContinue={handleContinue}
        onBack={handleBack}
        validationError={validationError}
        progress={screenProgress}
        continueLabel={editContinueLabel}
      >
        {/* Pre-filled government charges as toggle cards */}
        {govtChargeItems.map((item) => (
          <CostCard key={item.key}>
            <Text style={{ fontSize: 15, color: C.text, fontWeight: '500', marginBottom: 6 }}>
              {t(`onboarding.housing.q6g.${item.labelKey}`)}
            </Text>
            {item.enabled ? (
              <Text style={{ ...T.caption, color: C.muted, marginBottom: 8 }}>
                {item.getNote ? item.getNote() : t(`onboarding.housing.q6g.${item.noteKey}`)}
              </Text>
            ) : null}
            {item.enabled ? (
              <InputGroup nested label={t('onboarding.housing.q6g.customAmountLabel')}>
                <LabeledInput
                  value={item.amount}
                  onChangeText={item.setAmount}
                  numeric
                  placeholder="0"
                  large
                  inGroup
                  currency={currency}
                  frequency="/yr"
                />
              </InputGroup>
            ) : (
              <Text style={{ ...T.helper, color: C.muted, marginBottom: 8 }}>
                {t(`onboarding.housing.q6g.${item.dontPayKey}`)}
              </Text>
            )}
            <View style={{
              width: '100%',
              borderRadius: R.input,
              borderWidth: 1,
              borderColor: C.border,
              overflow: 'hidden',
              flexDirection: 'row',
              marginTop: 8,
            }}>
              <PillToggle
                label={t('common.no')}
                selected={!item.enabled}
                onPress={() => item.setEnabled(false)}
                paddingVertical={8}
                fontSize={13}
                fontWeight="500"
              />
              <PillToggle
                label={t('common.yes')}
                selected={item.enabled}
                onPress={() => item.setEnabled(true)}
                paddingVertical={8}
                fontSize={13}
                fontWeight="500"
              />
            </View>
          </CostCard>
        ))}

        {/* Custom tax items */}
        {customTaxItems.map((item, index) => (
          <ScrollFocusAnchor key={item.id} focusId={String(item.id)} focusToken={focusToken}>
          <AnimatedRow
            visible={item.visible}
            onAnimationEnd={() => {
              if (!item.visible) finalizeRemoveTaxItem(item.id);
            }}
          >
            <CostCard>
              <LabeledInput
                label={t('onboarding.housing.q6g.customPlaceholder')}
                value={item.name}
                onChangeText={(v) => updateCustomTaxItem(index, 'name', v)}
                placeholder={t('onboarding.housing.q6g.customPlaceholder')}
                inCard
                containerStyle={{ marginBottom: 10 }}
              />
              <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-end' }}>
                <LabeledInput
                  label={t('onboarding.housing.q6g.customAmountLabel')}
                  value={item.amount}
                  onChangeText={(v) => updateCustomTaxItem(index, 'amount', v)}
                  numeric
                  placeholder={t('onboarding.housing.q6g.customAmountPlaceholder')}
                  inCard
                  currency={currency}
                  containerStyle={{ flex: 1, marginBottom: 0 }}
                />
                <RemoveButton onPress={() => removeCustomTaxItem(item.id)} />
              </View>

              <FrequencyPills
                options={['monthly', 'annual']}
                value={item.frequency}
                onChange={(v) => updateCustomTaxItem(index, 'frequency', v)}
                small
                labelMap={{
                  monthly: t('onboarding.housing.q6g.frequencyMonthly'),
                  annual: t('onboarding.housing.q6g.frequencyAnnual'),
                }}
              />
            </CostCard>
          </AnimatedRow>
          </ScrollFocusAnchor>
        ))}

        <AddAnotherButton
          label={t('onboarding.housing.q6g.addCustom')}
          onPress={addCustomTaxItem}
        />
      </QuestionScreen>
    );
  }

  return null;
}
