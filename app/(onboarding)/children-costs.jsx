import { useState, useEffect } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useI18n } from '../../lib/i18n';
import { getData, setData } from '../../lib/storage';
import { getCurrencySymbol } from '../../lib/currency';
import { C, S, T, R } from '../../constants/onboarding-theme';
import QuestionScreen from '../../components/onboarding/QuestionScreen';
import AnimatedSlideIn from '../../components/onboarding/AnimatedSlideIn';
import LabeledInput from '../../components/onboarding/LabeledInput';
import FrequencyPills from '../../components/onboarding/FrequencyPills';
import SuggestionChip from '../../components/onboarding/SuggestionChip';
import AddChip from '../../components/onboarding/AddChip';
import ScrollFocusAnchor from '../../components/onboarding/ScrollFocusAnchor';
import InputGroup from '../../components/onboarding/InputGroup';
import { useSectionExit } from '../../lib/finishOnboardingSection';

const FREQUENCIES = ['monthly', 'quarterly', 'annual'];

/** Maps age-group field keys to the matching i18n field keys under onboarding.childrenCosts.q9.field */
const FIELD_I18N_MAP = {
  daycare: 'nursery',
  nanny: 'nanny',
  nappies: 'diapers',
  babySupplies: 'formula',
  kindergarten: 'kindergarten',
  afterHours: 'afterSchool',
  extracurricular: 'extracurricular',
  schoolFees: 'schoolSupplies',
  schoolSupplies: 'schoolSupplies',
  afterSchool: 'afterSchool',
  tutoring: 'extracurricular',
  drivingLessons: 'transport',
  uniFees: 'savings',
};

const AGE_GROUP_FIELDS = {
  '0-2': ['daycare', 'nanny', 'nappies', 'babySupplies'],
  '3-5': ['kindergarten', 'afterHours', 'extracurricular'],
  '6-15': ['schoolFees', 'schoolSupplies', 'afterSchool', 'tutoring'],
  '16-18': ['schoolFees', 'schoolSupplies', 'afterSchool', 'tutoring', 'drivingLessons', 'uniFees'],
};

export default function ChildrenCostsScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const { isEditMode, completeSection, leaveSection, editContinueLabel } = useSectionExit();

  const [household, setHousehold] = useState(null);
  const [children, setChildren] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
  const [validationError, setValidationError] = useState('');
  const [focusToken, setFocusToken] = useState(null);

  const [costsData, setCostsData] = useState({});
  const [activeFields, setActiveFields] = useState({});

  const [currencyCode, setCurrencyCode] = useState('CZK');
  const currency = getCurrencySymbol(currencyCode);

  useEffect(() => {
    (async () => {
      const h = await getData('pocketos_household');
      setHousehold(h);
      const loc = await getData('pocketos_location');
      if (loc?.currency) setCurrencyCode(loc.currency);

      if (!h?.children?.length) {
        if (isEditMode) {
          leaveSection(() => {});
        } else {
          router.replace('/(onboarding)/splash-pets');
        }
        return;
      }

      setChildren(h.children);

      const initData = {};
      const initActive = {};
      h.children.forEach((child, idx) => {
        const fields = AGE_GROUP_FIELDS[child.ageGroup] || [];
        const fieldData = {};
        fields.forEach(f => { fieldData[f] = { amount: '', frequency: 'monthly' }; });
        initData[`child_${idx}`] = fieldData;
        initActive[`child_${idx}`] = {};
      });
      setCostsData(initData);
      setActiveFields(initActive);
    })();
  }, []);

  const toggleField = (childKey, field, scroll = false) => {
    const willActivate = !activeFields[childKey]?.[field];
    setActiveFields(prev => ({
      ...prev,
      [childKey]: {
        ...prev[childKey],
        [field]: willActivate,
      },
    }));
    if (scroll && willActivate) {
      setFocusToken(`${childKey}_${field}`);
    }
  };

  const updateField = (childKey, field, updates) => {
    setCostsData(prev => ({
      ...prev,
      [childKey]: {
        ...prev[childKey],
        [field]: { ...prev[childKey][field], ...updates },
      },
    }));
  };

  const addOtherField = (childKey) => {
    let newKey = null;
    setCostsData(prev => {
      const childData = { ...prev[childKey] };
      let otherIdx = 1;
      while (childData[`other_${otherIdx}`]) {
        otherIdx++;
      }
      newKey = `other_${otherIdx}`;
      childData[newKey] = { amount: '', frequency: 'monthly' };
      return { ...prev, [childKey]: childData };
    });
    setTimeout(() => {
      if (newKey) {
        toggleField(childKey, newKey, true);
      }
    }, 50);
  };

  const persistChildrenCosts = async () => {
    await completeSection({
      persist: async () => { await setData('pocketos_children_costs', costsData); },
      onboardingPatch: { completed: false, currentStep: 'children-costs', percentComplete: 78 },
      nextRoute: '/(onboarding)/splash-pets',
    });
  };

  const handleContinue = async () => {
    setValidationError('');

    if (isEditMode) {
      await persistChildrenCosts();
      return;
    }

    if (activeTab < children.length - 1) {
      setActiveTab(activeTab + 1);
      return;
    }

    await persistChildrenCosts();
  };

  const handleBack = async () => {
    setValidationError('');
    if (activeTab > 0) {
      setActiveTab(activeTab - 1);
      return;
    }
    await setData('pocketos_children_costs', costsData);
    leaveSection(() => router.replace('/(onboarding)/splash-children'));
  };

  const progress = 78;
  const screenProgress = isEditMode ? undefined : progress;
  const renderChildForm = (child, idx) => {
    const childKey = `child_${idx}`;
    const fields = AGE_GROUP_FIELDS[child.ageGroup] || [];
    const data = costsData[childKey] || {};
    const active = activeFields[childKey] || {};

    const allFieldKeys = [...fields];
    Object.keys(data).forEach(k => {
      if (k.startsWith('other_') && !allFieldKeys.includes(k)) {
        allFieldKeys.push(k);
      }
    });

    const fieldLabel = (field) => {
      const isOther = field.startsWith('other_');
      const i18nField = FIELD_I18N_MAP[field] || field;
      return isOther
        ? t('onboarding.childrenCosts.q9.field.other')
        : t(`onboarding.childrenCosts.q9.field.${i18nField}`);
    };

    return (
      <View>
        <Text style={{ ...T.fieldLabel, color: C.muted, marginBottom: 10 }}>
          {t('onboarding.childrenCosts.q9.suggestions')}
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 16 }}>
          {allFieldKeys.map(field => (
            <SuggestionChip
              key={field}
              label={fieldLabel(field)}
              active={active[field]}
              onPress={() => toggleField(childKey, field, true)}
            />
          ))}
          <AddChip
            label={t('onboarding.childrenCosts.q9.addAnother')}
            onPress={() => addOtherField(childKey)}
          />
        </View>

        {allFieldKeys.map(field => {
          const isActive = active[field];
          if (!isActive) return null;
          const isOther = field.startsWith('other_');
          return (
            <ScrollFocusAnchor
              key={field}
              focusId={`${childKey}_${field}`}
              focusToken={focusToken}
            >
              <AnimatedSlideIn visible={isActive}>
                <InputGroup
                  label={fieldLabel(field)}
                  onRemove={isOther ? () => {
                    setCostsData(prev => {
                      const childData = { ...prev[childKey] };
                      delete childData[field];
                      return { ...prev, [childKey]: childData };
                    });
                    toggleField(childKey, field);
                  } : undefined}
                  style={{ marginBottom: 16 }}
                >
                  <LabeledInput
                    value={data[field]?.amount || ''}
                    onChangeText={(v) => updateField(childKey, field, { amount: v })}
                    numeric
                    placeholder={t('onboarding.childrenCosts.q9.amountPlaceholder')}
                    large
                    inGroup
                    currency={currency}
                  />
                  <FrequencyPills
                    options={FREQUENCIES}
                    value={data[field]?.frequency}
                    onChange={(freq) => updateField(childKey, field, { frequency: freq })}
                    small
                  />
                </InputGroup>
              </AnimatedSlideIn>
            </ScrollFocusAnchor>
          );
        })}
      </View>
    );
  };

  const currentChild = children[activeTab];

  return (
    <QuestionScreen
      chapter={t('onboarding.childrenCosts.chapter')}
      title={currentChild ? t('onboarding.childrenCosts.q9.title', { name: currentChild.displayName || `${t('onboarding.childrenCosts.child')} ${activeTab + 1}` }) : ''}
      helper={currentChild ? t('onboarding.childrenCosts.q9.helper', { name: currentChild.displayName || `${t('onboarding.childrenCosts.child')} ${activeTab + 1}`, ageGroup: currentChild.ageGroup || '' }) : ''}
      onContinue={handleContinue}
      onBack={handleBack}
      validationError={validationError}
      progress={screenProgress}
      continueLabel={editContinueLabel}
      animationKey={activeTab}
    >
      {children.length > 0 && (
        <View style={{ flexDirection: 'row', borderRadius: R.input, borderWidth: 1, borderColor: C.border, overflow: 'hidden', marginBottom: 20 }}>
          {children.map((child, idx) => (
            <Pressable
              key={idx}
              onPress={() => { setActiveTab(idx); setValidationError(''); }}
              style={{
                flex: 1,
                paddingVertical: 14,
                paddingHorizontal: 12,
                backgroundColor: activeTab === idx ? C.chipSelectedBg : 'transparent',
                alignItems: 'center',
              }}
            >
              <Text style={{
                fontSize: 13,
                fontWeight: '500',
                color: activeTab === idx ? C.primary : C.muted,
              }}>
                {child.displayName || `${t('onboarding.childrenCosts.child')} ${idx + 1}`}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      {currentChild && renderChildForm(currentChild, activeTab)}
    </QuestionScreen>
  );
}
