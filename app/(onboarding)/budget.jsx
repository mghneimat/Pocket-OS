import { useState, useEffect, useRef } from 'react';
import { View, Text, Pressable, ScrollView, Animated, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useI18n } from '../../lib/i18n';
import { getData, setData } from '../../lib/storage';
import { toMonthly, formatCurrency, totalMonthlyCosts, availableBudget, displayBudget, effectiveSpendingBudget } from '../../lib/finance';
import { aggregateHouseholdCosts, computeTotalMonthlyIncome } from '../../lib/householdBudget';
import { computeGoalGap } from '../../lib/insights';
import { getMonthlySavingsReservation } from '../../lib/incomeGoals';
import { splitFlexibleBudget, resolveBudgetSpendingRatio } from '../../lib/budgetSplit';
import BudgetSplitSlider from '../../components/onboarding/BudgetSplitSlider';
import LabeledInput from '../../components/onboarding/LabeledInput';
import InputGroup from '../../components/onboarding/InputGroup';
import YesNoToggle from '../../components/onboarding/YesNoToggle';
import { getCurrencySymbol } from '../../lib/currency';
import { buildBudgetExportRows, exportBudgetCsv, exportBudgetXlsx, exportBudgetPdf } from '../../lib/budgetExport';
import QuestionScreen from '../../components/onboarding/QuestionScreen';
import OptionCard from '../../components/onboarding/OptionCard';
import AnimatedSlideIn from '../../components/onboarding/AnimatedSlideIn';
import BudgetExportBar from '../../components/onboarding/BudgetExportBar';
import FrequencyPills from '../../components/onboarding/FrequencyPills';
import BudgetAmountCell from '../../components/onboarding/BudgetAmountCell';
import BudgetExpandChevron from '../../components/onboarding/BudgetExpandChevron';
import { useOnboardingLayout, getRowDirection, getLabelCellStyle } from '../../lib/onboardingLayout';
import { C, S, T, R, tabularNums } from '../../constants/onboarding-theme';
import { useSectionExit } from '../../lib/finishOnboardingSection';
import { periodKey } from '../../lib/dailyLog';
import { normalizeResetDestination } from '../../lib/monthEndRouting';

function getIncomeBreakdownItems(income, t) {
  const userMonthly = toMonthly(income?.amount || 0, income?.frequency || 'monthly');
  const partnerMonthly = toMonthly(income?.partnerAmount || 0, income?.partnerFrequency || 'monthly');
  const breakdowns = [];
  if (userMonthly > 0) {
    breakdowns.push({ label: t('onboarding.budget.q14.incomeUser'), amount: userMonthly, indent: 28 });
  }
  if (partnerMonthly > 0) {
    breakdowns.push({ label: t('onboarding.budget.q14.incomePartner'), amount: partnerMonthly, indent: 28 });
  }
  (income?.otherIncomeRows || []).forEach((r, idx) => {
    const monthly = toMonthly(r.amount || 0, r.frequency || 'monthly');
    if (monthly > 0) {
      breakdowns.push({
        label: r.label || `${t('onboarding.budget.q14.incomeOther')} ${idx + 1}`,
        amount: monthly,
        indent: 28,
      });
    }
  });
  return breakdowns;
}

export default function BudgetScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const layout = useOnboardingLayout();
  const { isEditMode, completeSection, leaveSection, editContinueLabel } = useSectionExit();

  const [step, setStep] = useState('q14');
  const [validationError, setValidationError] = useState('');

  // Financial data for live calculation
  const [income, setIncome] = useState(null);
  const [costs, setCosts] = useState([]);
  const [costsByCategory, setCostsByCategory] = useState([]);
  const [debts, setDebts] = useState([]);
  const [currencyCode, setCurrencyCode] = useState('CZK');
  const currency = getCurrencySymbol(currencyCode);

  // Q14 — Monthly budget
  const [monthlyFlexible, setMonthlyFlexible] = useState('');
  const [calculatedBudget, setCalculatedBudget] = useState(0);
  const [budgetDisplayFrequency, setBudgetDisplayFrequency] = useState('daily');
  const [budgetSpendingRatio, setBudgetSpendingRatio] = useState(1);

  // Q14 — Savings goal deduction preference
  const [deductSavingsGoal, setDeductSavingsGoal] = useState(false);

  // Q14a — Rollover strategy
  const [rolloverStrategy, setRolloverStrategy] = useState(null);
  const [rolloverMultiplier, setRolloverMultiplier] = useState(null);
  const [rolloverCapType, setRolloverCapType] = useState('multiplier');
  const [rolloverCapAmount, setRolloverCapAmount] = useState('');
  const [resetUnspentDestination, setResetUnspentDestination] = useState('looseMoney');
  const [resetOtherGoalNote, setResetOtherGoalNote] = useState('');

  // Expanded rows state for the summary table
  const [expandedRows, setExpandedRows] = useState({});
  const [tableVisible, setTableVisible] = useState(false);
  const [allExpanded, setAllExpanded] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  // Animated values for expand/collapse height — store actual pixel heights directly
  const expandAnims = useRef({
    income: new Animated.Value(0),
    fixedCosts: new Animated.Value(0),
  }).current;

  // Measured content heights for each expandable section
  const contentHeights = useRef({ income: 0, fixedCosts: 0 }).current;

  // Dynamic animated values for per-category expand within costs breakdown
  const catExpandAnims = useRef({}).current;
  const catContentHeights = useRef({}).current;

  const getCatAnim = (catKey) => {
    if (!catExpandAnims[catKey]) {
      catExpandAnims[catKey] = new Animated.Value(0);
    }
    return catExpandAnims[catKey];
  };

  const getCatHeight = (catKey) => {
    if (!catContentHeights[catKey]) {
      catContentHeights[catKey] = 0;
    }
    return catContentHeights[catKey];
  };

  const setCatHeight = (catKey, h) => {
    catContentHeights[catKey] = h;
  };

  // Calculate the height of a category's items based on item count (each item row ~28px)
  const getCategoryItemsHeight = (cat) => {
    return cat.items.length * 28; // paddingVertical:6*2 + fontSize:12*1.2 + borderTop:1 ≈ 27.4px, rounded to 28
  };

  const toggleRow = (key) => {
    if (key === 'income' && getIncomeBreakdownItems(income, t).length === 0) return;

    const isExpanding = !expandedRows[key];

    if (key === 'fixedCosts') {
      // fixedCosts uses direct pixel values (not normalized 0→1)
      const targetHeight = isExpanding ? (contentHeights.fixedCosts || 200) : 0;
      // Use the current animated value as the starting point for collapse animation,
      // so it smoothly animates from wherever it currently is down to 0
      const currentAnimValue = isExpanding ? 0 : (expandAnims.fixedCosts.__getValue() || contentHeights.fixedCosts || 200);
      expandAnims.fixedCosts.setValue(currentAnimValue);
      Animated.timing(expandAnims.fixedCosts, {
        toValue: targetHeight,
        duration: 280,
        useNativeDriver: false,
      }).start();
    } else {
      // income uses normalized 0→1 with interpolation
      const toValue = isExpanding ? 1 : 0;
      Animated.timing(expandAnims[key], {
        toValue,
        duration: 280,
        useNativeDriver: false,
      }).start();
    }

    setExpandedRows(prev => ({ ...prev, [key]: isExpanding }));
  };

  const toggleCategory = (catKey) => {
    const isExpanding = !expandedRows[catKey];
    const toValue = isExpanding ? 1 : 0;

    const anim = getCatAnim(catKey);
    Animated.timing(anim, {
      toValue,
      duration: 280,
      useNativeDriver: false,
    }).start();

    setExpandedRows(prev => ({ ...prev, [catKey]: isExpanding }));

    // Recalculate fixedCosts height immediately (synchronously) so both animations start at the same time
    // Pass the new expanded state directly since React state update hasn't committed yet
    recalcFixedCostsHeight(true, { [catKey]: isExpanding });
  };

  const toggleAll = () => {
    const willExpand = !allExpanded;
    setAllExpanded(willExpand);
    const hasIncomeBreakdown = getIncomeBreakdownItems(income, t).length > 0;

    const newExpanded = { ...expandedRows };
    newExpanded.income = hasIncomeBreakdown && willExpand;
    newExpanded.fixedCosts = willExpand;

    costsByCategory.forEach((cat) => {
      const catKey = `cat_${cat.category}`;
      newExpanded[catKey] = willExpand;
    });

    setExpandedRows(newExpanded);

    // Animate income only when there are line items to show
    if (hasIncomeBreakdown) {
      const incomeToValue = willExpand ? 1 : 0;
      expandAnims.income.setValue(willExpand ? 0 : 1);
      Animated.timing(expandAnims.income, {
        toValue: incomeToValue,
        duration: 280,
        useNativeDriver: false,
      }).start();
    } else {
      expandAnims.income.setValue(0);
    }

    // Animate all category sub-rows
    costsByCategory.forEach((cat) => {
      const catKey = `cat_${cat.category}`;
      const anim = getCatAnim(catKey);
      const catToValue = willExpand ? 1 : 0;
      anim.setValue(willExpand ? 0 : 1);
      Animated.timing(anim, {
        toValue: catToValue,
        duration: 280,
        useNativeDriver: false,
      }).start();
    });

    // Animate fixedCosts main container
    recalcFixedCostsHeight(true, newExpanded);
    const fixedTarget = willExpand ? (contentHeights.fixedCosts || 200) : 0;
    const fixedCurrent = willExpand ? 0 : (expandAnims.fixedCosts.__getValue() || contentHeights.fixedCosts || 200);
    expandAnims.fixedCosts.setValue(fixedCurrent);
    Animated.timing(expandAnims.fixedCosts, {
      toValue: fixedTarget,
      duration: 280,
      useNativeDriver: false,
    }).start();
  };

  const onContentLayout = (key, event) => {
    const h = event.nativeEvent.layout.height;
    if (h > 0 && contentHeights[key] !== h) {
      contentHeights[key] = h;
      // If already expanded, set animated value to match new height
      if (expandedRows[key]) {
        if (key === 'fixedCosts') {
          // fixedCosts uses direct pixel values — only update if not currently animating
          // (recalcFixedCostsHeight or toggleRow handles animation; this is a fallback for layout shifts)
          expandAnims.fixedCosts.setValue(h);
        } else {
          expandAnims[key].setValue(1);
        }
      }
    }
  };

  // Dedicated onLayout handler for the fixedCosts inner content View
  // Updates contentHeights.fixedCosts with the actual rendered height.
  // If the section is expanded and the measured height differs from the current animated value,
  // smoothly animate to the measured height.
  const onFixedCostsContentLayout = (event) => {
    const h = event.nativeEvent.layout.height;
    if (h > 0 && contentHeights.fixedCosts !== h) {
      const oldHeight = contentHeights.fixedCosts;
      contentHeights.fixedCosts = h;
      if (expandedRows.fixedCosts && oldHeight > 0) {
        const currentAnim = expandAnims.fixedCosts.__getValue();
        if (Math.abs(currentAnim - h) > 1) {
          expandAnims.fixedCosts.setValue(currentAnim);
          Animated.timing(expandAnims.fixedCosts, {
            toValue: h,
            duration: 280,
            useNativeDriver: false,
          }).start();
        }
      }
    }
  };

  const onCatContentLayout = (catKey, event) => {
    const h = event.nativeEvent.layout.height;
    if (h > 0 && catContentHeights[catKey] !== h) {
      catContentHeights[catKey] = h;
      if (expandedRows[catKey]) {
        const anim = getCatAnim(catKey);
        anim.setValue(1);
        // Recalculate fixedCosts height using the newly measured height
        // Use animate=true so the outer container smoothly adjusts if measured height differs from calculated
        recalcFixedCostsHeight(true);
      }
    }
  };

  // Get the height of a category's expanded items, using measured height if available, otherwise calculated
  const getCategoryContentHeight = (cat) => {
    const catKey = `cat_${cat.category}`;
    const measured = getCatHeight(catKey);
    if (measured > 0) return measured;
    return getCategoryItemsHeight(cat);
  };

  // Recalculate the fixedCosts content height based on which categories are expanded
  // overrideState can be passed to override expandedRows for a specific category (used during toggle before state updates)
  const recalcFixedCostsHeight = (animate = false, overrideState = null) => {
    // Sum up: category headers (each ~33px based on paddingVertical:8*2 + fontSize:13*~1.3 ≈ 33px) + expanded items
    let total = 0;
    costsByCategory.forEach((cat) => {
      const catKey = `cat_${cat.category}`;
      // Category header height (paddingVertical:8*2 + fontSize:13*~1.3 + borderTop:1 ≈ 33px)
      total += 33;
      // Use override state if provided for this category, otherwise use current expandedRows state
      const isExpanded = overrideState && overrideState[catKey] !== undefined ? overrideState[catKey] : expandedRows[catKey];
      if (isExpanded) {
        // Use measured height if available (from onCatContentLayout), otherwise calculate from data
        total += getCategoryContentHeight(cat);
      }
    });
    if (total > 0 && contentHeights.fixedCosts !== total) {
      const oldTotal = contentHeights.fixedCosts;
      contentHeights.fixedCosts = total;
      if (expandedRows.fixedCosts) {
        if (animate) {
          // Animate the pixel height directly from oldTotal to newTotal
          expandAnims.fixedCosts.setValue(oldTotal);
          Animated.timing(expandAnims.fixedCosts, {
            toValue: total,
            duration: 280,
            useNativeDriver: false,
          }).start();
        } else {
          expandAnims.fixedCosts.setValue(total);
        }
      }
    }
  };

  useEffect(() => {
    (async () => {
      setDataLoading(true);
      setDataError('');
      try {
      const inc = await getData('pocketos_income');
      const d = await getData('pocketos_debts') || [];
      const loc = await getData('pocketos_location');
      if (loc?.currency) setCurrencyCode(loc.currency);
      setIncome(inc);
      setDebts(d);

      const household = await getData('pocketos_household') || {};
      const housing = await getData('pocketos_housing') || {};
      const transport = await getData('pocketos_transport') || {};
      const health = await getData('pocketos_health') || {};
      const childrenCosts = await getData('pocketos_children_costs') || {};
      const pets = await getData('pocketos_pets') || [];
      const subs = await getData('pocketos_subscriptions') || [];
      const otherCosts = await getData('pocketos_other_costs') || [];

      const { allCosts, byCategory } = aggregateHouseholdCosts({
        housing,
        transport,
        health,
        childrenCosts,
        pets,
        subs,
        otherCosts,
        household,
      }, t);

      setCosts(allCosts);
      setCostsByCategory(byCategory);

      // Initialize fixedCosts content height based on category headers only (all collapsed initially)
      const initialHeight = byCategory.reduce((sum, cat) => sum + 33, 0);
      if (initialHeight > 0) {
        contentHeights.fixedCosts = initialHeight;
      }

      // Calculate available budget
      const totalIncome = computeTotalMonthlyIncome(inc);

      // Fixed costs from all aggregated costs
      const fixedCosts = totalMonthlyCosts(allCosts);

      // Min debt payments
      const debtPayments = d.reduce((sum, debt) => sum + parseFloat(debt.minPayment || 0), 0);

      const avail = availableBudget(totalIncome, fixedCosts, debtPayments);
      setCalculatedBudget(avail);
      // Always derive flexible budget from live income/costs on this screen — not a stale saved value
      setMonthlyFlexible(String(Math.round(avail)));

      const savedBudget = await getData('pocketos_budget');
      if (savedBudget?.budgetDisplayFrequency) {
        setBudgetDisplayFrequency(savedBudget.budgetDisplayFrequency);
      }
      if (savedBudget?.rolloverStrategy) {
        setRolloverStrategy(savedBudget.rolloverStrategy);
      }
      if (savedBudget?.rolloverMultiplier) {
        setRolloverMultiplier(savedBudget.rolloverMultiplier);
      }
      if (savedBudget?.rolloverCapType) {
        setRolloverCapType(savedBudget.rolloverCapType);
      }
      if (savedBudget?.rolloverCapAmount != null) {
        setRolloverCapAmount(String(savedBudget.rolloverCapAmount));
      }
      if (savedBudget?.resetUnspentDestination) {
        setResetUnspentDestination(normalizeResetDestination(savedBudget.resetUnspentDestination));
      }
      if (savedBudget?.resetOtherGoalNote) {
        setResetOtherGoalNote(savedBudget.resetOtherGoalNote);
      }
      if (savedBudget?.deductSavingsGoal === true) {
        setDeductSavingsGoal(true);
      }
      if (savedBudget) {
        setBudgetSpendingRatio(resolveBudgetSpendingRatio(savedBudget, avail));
      }
      if (isEditMode) {
        setStep('q14');
      }

      // Show the table with animation once data is ready
      setTableVisible(true);
      } catch {
        setDataError(t('onboarding.budget.q14.loadError'));
        setTableVisible(false);
      } finally {
        setDataLoading(false);
      }
    })();
  }, [reloadKey, t, isEditMode]);

  const saveBudget = async () => {
    let flex = parseFloat(monthlyFlexible);
    if (!Number.isFinite(flex)) {
      const userM = toMonthly(income?.amount || 0, income?.frequency || 'monthly');
      const partnerM = toMonthly(income?.partnerAmount || 0, income?.partnerFrequency || 'monthly');
      const otherM = (income?.otherIncomeRows || []).reduce(
        (sum, s) => sum + toMonthly(s.amount || 0, s.frequency || 'monthly'),
        0,
      );
      flex = availableBudget(
        userM + partnerM + otherM,
        totalMonthlyCosts(costs),
        debts.reduce((sum, debt) => sum + parseFloat(debt.minPayment || 0), 0),
      );
    }
    const strategy = rolloverStrategy || 'free';
    const { spendingMonthly, savingsShift, ratio } = splitFlexibleBudget(flex, budgetSpendingRatio);

    await completeSection({
      persist: async () => {
        const existing = (await getData('pocketos_budget')) || {};
        await setData('pocketos_budget', {
          ...existing,
          monthlyFlexible: spendingMonthly,
          budgetSpendingRatio: ratio,
          budgetSavingsShift: savingsShift,
          budgetDisplayFrequency,
          rolloverStrategy: strategy,
          rolloverMultiplier: strategy === 'capped' && rolloverCapType === 'multiplier' ? rolloverMultiplier : null,
          rolloverCapType: strategy === 'capped' ? rolloverCapType : null,
          rolloverCapAmount: strategy === 'capped' && rolloverCapType === 'amount'
            ? Math.round(parseFloat(rolloverCapAmount) || 0)
            : null,
          resetUnspentDestination: strategy === 'reset' ? resetUnspentDestination : null,
          resetOtherGoalNote: strategy === 'reset' && resetUnspentDestination === 'otherGoal'
            ? (resetOtherGoalNote.trim() || null)
            : null,
          rolloverBalance: existing.rolloverBalance ?? 0,
          looseMoneyBalance: existing.looseMoneyBalance ?? 0,
          otherGoalBalance: existing.otherGoalBalance ?? 0,
          lastClosedPeriod: existing.lastClosedPeriod || periodKey(),
          monthEndHistory: existing.monthEndHistory || [],
          deductSavingsGoal: deductSavingsGoal === true,
        });
      },
      onboardingPatch: { completed: false, currentStep: 'budget', percentComplete: 95 },
      nextRoute: '/(onboarding)/splash-review',
    });
  };

  const handleContinue = async () => {
    setValidationError('');

    if (isEditMode) {
      await saveBudget();
      return;
    }

    if (step === 'q14') {
      if (dataLoading || dataError) return;
      const userM = toMonthly(income?.amount || 0, income?.frequency || 'monthly');
      const partnerM = toMonthly(income?.partnerAmount || 0, income?.partnerFrequency || 'monthly');
      const otherM = (income?.otherIncomeRows || []).reduce(
        (sum, s) => sum + toMonthly(s.amount || 0, s.frequency || 'monthly'),
        0,
      );
      const flexMonthly = availableBudget(
        userM + partnerM + otherM,
        totalMonthlyCosts(costs),
        debts.reduce((sum, debt) => sum + parseFloat(debt.minPayment || 0), 0),
      );
      if (!Number.isFinite(flexMonthly)) {
        setValidationError(t('onboarding.budget.q14.validation'));
        return;
      }
      setMonthlyFlexible(String(Math.round(flexMonthly)));
      setCalculatedBudget(flexMonthly);
      setStep('q14a');
      return;
    }

    if (step === 'q14a') {
      if (!rolloverStrategy) {
        setValidationError(t('onboarding.budget.q14a.validation'));
        return;
      }
      if (rolloverStrategy === 'capped') {
        if (rolloverCapType === 'multiplier' && !rolloverMultiplier) {
          setValidationError(t('onboarding.budget.q14a.validationCapMultiplier'));
          return;
        }
        if (rolloverCapType === 'amount' && !(parseFloat(rolloverCapAmount) > 0)) {
          setValidationError(t('onboarding.budget.q14a.validationCapAmount'));
          return;
        }
      }
      if (rolloverStrategy === 'reset' && resetUnspentDestination === 'otherGoal' && !resetOtherGoalNote.trim()) {
        setValidationError(t('onboarding.budget.q14a.validationOtherGoal'));
        return;
      }

      await saveBudget();
      return;
    }
  };

  const handleBack = () => {
    setValidationError('');
    if (step === 'q14a') { setStep('q14'); return; }
    leaveSection(() => router.replace('/(onboarding)/splash-budget'));
  };

  const progress = 95;
  const screenProgress = isEditMode ? undefined : progress;

  const renderQ14 = () => {
    const userMonthly = toMonthly(income?.amount || 0, income?.frequency || 'monthly');
    const partnerMonthly = toMonthly(income?.partnerAmount || 0, income?.partnerFrequency || 'monthly');
    const otherMonthly = (income?.otherIncomeRows || []).reduce((sum, s) => sum + toMonthly(s.amount || 0, s.frequency || 'monthly'), 0);
    const totalIncome = userMonthly + partnerMonthly + otherMonthly;
    const fixedCosts = totalMonthlyCosts(costs);
    const debtPayments = debts.reduce((sum, debt) => sum + parseFloat(debt.minPayment || 0), 0);
    const liveFlexibleMonthly = availableBudget(totalIncome, fixedCosts, debtPayments);
    const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
    const goalGap = computeGoalGap({ income, monthlyFlexible: liveFlexibleMonthly });
    const monthlySavingsRequired = getMonthlySavingsReservation(income, goalGap);
    const hasSavingsGoal = monthlySavingsRequired > 0;
    const { spendingMonthly, savingsShift } = splitFlexibleBudget(liveFlexibleMonthly, budgetSpendingRatio);
    const effectiveMonthly = effectiveSpendingBudget(
      spendingMonthly,
      monthlySavingsRequired,
      deductSavingsGoal === true,
    );
    const previewAmount = displayBudget(effectiveMonthly, budgetDisplayFrequency, daysInMonth);

    const incomeBreakdowns = getIncomeBreakdownItems(income, t);
    const hasIncomeBreakdown = incomeBreakdowns.length > 0;

    const rows = [
      {
        key: 'income',
        label: t('onboarding.budget.q14.income'),
        amount: totalIncome,
        expandable: hasIncomeBreakdown,
      },
      {
        key: 'fixedCosts',
        label: t('onboarding.budget.q14.fixedCosts'),
        amount: -fixedCosts,
        expandable: true,
      },
      {
        key: 'debtPayments',
        label: t('onboarding.budget.q14.debtPayments'),
        amount: -debtPayments,
        expandable: false,
      },
    ];

    const rowToggleLabel = (label, isExpanded) =>
      isExpanded
        ? t('onboarding.budget.q14.a11y.collapseRow', { label })
        : t('onboarding.budget.q14.a11y.expandRow', { label });

    const renderChevron = (isExpanded) => <BudgetExpandChevron expanded={isExpanded} />;

    if (dataLoading) {
      return (
        <View accessibilityRole="progressbar" accessibilityLabel={t('onboarding.budget.q14.loading')}>
          <Text style={{ ...T.helper, color: C.muted }}>{t('onboarding.budget.q14.loading')}</Text>
        </View>
      );
    }

    if (dataError) {
      return (
        <View>
          <Text style={{ ...T.helper, color: C.danger, marginBottom: 16 }}>{dataError}</Text>
          <Pressable
            onPress={() => setReloadKey((k) => k + 1)}
            accessibilityRole="button"
            accessibilityLabel={t('common.retry')}
            style={({ pressed }) => ({
              alignSelf: 'flex-start',
              paddingVertical: 12,
              paddingHorizontal: 20,
              borderRadius: R.button,
              backgroundColor: pressed ? C.accentPressed : C.accent,
              minHeight: 44,
              justifyContent: 'center',
            })}
          >
            <Text style={{ fontSize: 15, fontWeight: '600', color: '#FFFFFF' }}>{t('common.retry')}</Text>
          </Pressable>
        </View>
      );
    }

    const incomeBreakdownExport = incomeBreakdowns.map(({ label, amount }) => ({ label, amount }));

    const exportRows = buildBudgetExportRows({
      summaryRows: rows,
      incomeBreakdown: incomeBreakdownExport,
      costsByCategory: costsByCategory.map((cat) => ({
        label: cat.label,
        items: cat.items.map((item) => ({
          label: item.label,
          amount: toMonthly(item.amount || 0, item.frequency || 'monthly'),
        })),
      })),
      totalBudget: liveFlexibleMonthly,
      currency,
      totalLabel: t('onboarding.budget.q14.budgetLabel'),
    });

    const exportMeta = {
      title: t('onboarding.budget.q14.title'),
      summaryTitle: t('onboarding.budget.q14.summaryTitle'),
      amountTitle: t('onboarding.budget.q14.amount'),
      currency,
    };

    const handleExportCsv = () => exportBudgetCsv(exportRows, exportMeta);
    const handleExportXlsx = () => exportBudgetXlsx(exportRows, exportMeta);
    const handleExportPdf = () => exportBudgetPdf(exportRows, exportMeta);

    const renderIncomeBreakdown = () => {
      if (!hasIncomeBreakdown) return null;

      const h = expandAnims.income.interpolate({
        inputRange: [0, 1],
        outputRange: [0, contentHeights.income || incomeBreakdowns.length * 33],
      });

      return (
        <Animated.View style={{ height: h, overflow: 'hidden' }}>
          <View
            onLayout={(e) => onContentLayout('income', e)}
            style={{ backgroundColor: C.bg }}
          >
            {incomeBreakdowns.map((b, i) => (
              <View
                key={i}
                style={{
                  flexDirection: getRowDirection(layout),
                  borderTopWidth: 1,
                  borderTopColor: C.divider,
                  borderBottomWidth: i === incomeBreakdowns.length - 1 ? 1 : 0,
                  borderBottomColor: C.divider,
                }}
              >
                <View style={getLabelCellStyle(layout, { paddingVertical: 8, indent: b.indent - 16 })}>
                  <Text style={{ flex: 1, fontSize: 13, color: C.muted }} numberOfLines={2}>{b.label}</Text>
                </View>
                <BudgetAmountCell
                  amount={b.amount}
                  currency={currency}
                  layout={layout}
                  fontSize={13}
                  fontWeight="500"
                  color={C.primary}
                  paddingVertical={8}
                />
              </View>
            ))}
          </View>
        </Animated.View>
      );
    };

    const renderCostsBreakdown = () => {
      return (
        <Animated.View style={{ height: expandAnims.fixedCosts, overflow: 'hidden' }}>
          <View
            onLayout={onFixedCostsContentLayout}
            style={{ backgroundColor: C.bg }}
          >
            {costsByCategory.map((cat, i) => {
              const catKey = `cat_${cat.category}`;
              const catMonthly = totalMonthlyCosts(cat.items);
              const isCatExpanded = expandedRows[catKey];
              const catAnim = getCatAnim(catKey);
              // Use calculated height from data (reliable immediately) with onLayout measurement as fallback
              const calculatedCatItemsHeight = getCategoryItemsHeight(cat);
              const measuredCatHeight = getCatHeight(catKey);
              const targetCatHeight = measuredCatHeight > 0 ? measuredCatHeight : (calculatedCatItemsHeight > 0 ? calculatedCatItemsHeight : 100);
              const catHeight = catAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, targetCatHeight],
              });

              return (
                <View key={catKey}>
                  {/* Category header row — pressable toggle */}
                  <Pressable
                    onPress={() => toggleCategory(catKey)}
                    accessibilityRole="button"
                    accessibilityLabel={rowToggleLabel(cat.label, isCatExpanded)}
                    accessibilityState={{ expanded: isCatExpanded }}
                    style={({ pressed, hovered }) => ({
                      minHeight: 44,
                      flexDirection: getRowDirection(layout),
                      borderTopWidth: 1,
                      borderTopColor: C.divider,
                      backgroundColor: pressed
                        ? C.overlayPressed
                        : hovered
                          ? C.overlayHover
                          : C.overlayHoverDarker,
                      ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
                    })}
                  >
                    <View style={getLabelCellStyle(layout, { paddingVertical: 8, indent: 12 })}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', flexShrink: 1, maxWidth: '100%' }}>
                        <Text style={{ fontSize: 13, fontWeight: '600', color: C.text, flexShrink: 1 }} numberOfLines={2}>{cat.label}</Text>
                        <BudgetExpandChevron expanded={isCatExpanded} />
                      </View>
                    </View>
                    <BudgetAmountCell
                      amount={catMonthly}
                      currency={currency}
                      layout={layout}
                      fontSize={13}
                      color={C.danger}
                      paddingVertical={8}
                    />
                  </Pressable>
                  {/* Individual items within category — animated expand/collapse */}
                  <Animated.View style={{ height: catHeight, overflow: 'hidden' }}>
                    <View
                      onLayout={(e) => onCatContentLayout(catKey, e)}
                    >
                      {cat.items.map((item, j) => {
                        const itemMonthly = toMonthly(item.amount || 0, item.frequency || 'monthly');
                        const isLastItem = j === cat.items.length - 1;
                        return (
                          <View
                            key={j}
                            style={{
                              flexDirection: getRowDirection(layout),
                              borderTopWidth: 1,
                              borderTopColor: C.divider,
                              borderBottomWidth: isLastItem ? 1 : 0,
                              borderBottomColor: C.divider,
                            }}
                          >
                            <View style={getLabelCellStyle(layout, { paddingVertical: 6, indent: 28 })}>
                              <Text style={{ flex: 1, fontSize: 12, color: C.muted }} numberOfLines={2}>{item.label}</Text>
                            </View>
                            <BudgetAmountCell
                              amount={itemMonthly}
                              currency={currency}
                              layout={layout}
                              fontSize={12}
                              fontWeight="400"
                              color={C.muted}
                              paddingVertical={6}
                            />
                          </View>
                        );
                      })}
                    </View>
                  </Animated.View>
                </View>
              );
            })}
          </View>
        </Animated.View>
      );
    };

    return (
      <View>
        {/* Minimalistic summary table — animate in on mount */}
        <AnimatedSlideIn visible={tableVisible} duration={400}>
        <View style={{
          marginTop: 20,
          marginBottom: 20,
          borderRadius: R.card,
          borderWidth: 1,
          borderColor: C.border,
          backgroundColor: C.surface,
          overflow: 'hidden',
        }}>
          {/* Table header — stacked note on narrow screens */}
          {layout.stackAmount ? (
            <View style={{
              paddingVertical: 12,
              paddingHorizontal: 16,
              backgroundColor: C.bg,
              borderBottomWidth: 1,
              borderBottomColor: C.divider,
            }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: C.muted }}>
                {t('onboarding.budget.q14.amountsNote', { currency })}
              </Text>
            </View>
          ) : (
            <View style={{
              flexDirection: 'row',
              backgroundColor: C.bg,
              borderBottomWidth: 1,
              borderBottomColor: C.divider,
            }}>
              <View style={{ flex: 1, paddingVertical: 14, paddingLeft: 16, borderRightWidth: 1, borderRightColor: C.divider }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: C.muted }}>
                  {t('onboarding.budget.q14.summaryTitle')}
                </Text>
              </View>
              <View style={{ width: layout.amountColumnWidth, paddingVertical: 14, paddingRight: layout.isCompact ? 10 : 16, alignItems: 'center' }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: C.muted }}>
                  {t('onboarding.budget.q14.amount')}
                </Text>
              </View>
            </View>
          )}

          {/* Expand/collapse all button */}
          <Pressable
            onPress={toggleAll}
            accessibilityRole="button"
            accessibilityLabel={allExpanded ? t('onboarding.budget.q14.a11y.collapseAll') : t('onboarding.budget.q14.a11y.expandAll')}
            style={({ pressed, hovered }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: 12,
              minHeight: 44,
              backgroundColor: pressed
                ? C.overlayPressed
                : hovered
                  ? C.overlayHover
                  : C.bg,
              borderBottomWidth: 1,
              borderBottomColor: C.divider,
              ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
            })}
          >
            <Text style={{ fontSize: 12, fontWeight: '600', color: C.primary, marginRight: 6 }}>
              {allExpanded ? t('onboarding.budget.q14.collapseAll') : t('onboarding.budget.q14.expandAll')}
            </Text>
            <BudgetExpandChevron expanded={allExpanded} />
          </Pressable>

          {/* Table rows */}
          {rows.map((row, i) => (
            <View key={row.key}>
              <Pressable
                onPress={row.expandable ? () => toggleRow(row.key) : undefined}
                disabled={!row.expandable}
                accessibilityRole={row.expandable ? 'button' : 'text'}
                accessibilityLabel={row.expandable ? rowToggleLabel(row.label, expandedRows[row.key]) : row.label}
                accessibilityState={row.expandable ? { expanded: !!expandedRows[row.key] } : undefined}
                style={({ pressed, hovered }) => ({
                  flexDirection: getRowDirection(layout),
                  borderBottomWidth: i < rows.length - 1 ? 1 : 0,
                  borderBottomColor: C.divider,
                  backgroundColor: row.expandable
                    ? pressed
                      ? C.overlayPressed
                      : hovered
                        ? C.overlayHover
                        : 'transparent'
                    : 'transparent',
                  minHeight: row.expandable ? 44 : undefined,
                  ...(row.expandable && Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
                })}
              >
                <View style={getLabelCellStyle(layout, { paddingVertical: 12 })}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flexShrink: 1, maxWidth: '100%' }}>
                    <Text style={{ fontSize: 14, color: C.text, flexShrink: 1 }} numberOfLines={layout.stackAmount ? 3 : 2}>
                      {row.label}
                    </Text>
                    {row.expandable ? <BudgetExpandChevron expanded={!!expandedRows[row.key]} /> : null}
                  </View>
                </View>
                <BudgetAmountCell
                  amount={row.amount}
                  currency={currency}
                  layout={layout}
                  fontSize={14}
                  paddingVertical={12}
                />
              </Pressable>

              {/* Expanded content */}
              {row.key === 'income' && renderIncomeBreakdown()}
              {row.key === 'fixedCosts' && renderCostsBreakdown()}
            </View>
          ))}

          {/* Total row */}
          <View style={{
            flexDirection: getRowDirection(layout),
            backgroundColor: C.bg,
            borderTopWidth: 1,
            borderTopColor: C.divider,
          }}>
            <View style={getLabelCellStyle(layout, { paddingVertical: 14 })}>
              <Text style={{ flex: 1, fontSize: 14, fontWeight: '700', color: C.primary }} numberOfLines={2}>
                {t('onboarding.budget.q14.budgetLabel')}
              </Text>
            </View>
            <BudgetAmountCell
              amount={liveFlexibleMonthly}
              currency={currency}
              layout={layout}
              fontSize={16}
              fontWeight="700"
              color={liveFlexibleMonthly >= 0 ? C.positive : C.danger}
              paddingVertical={14}
            />
          </View>
        </View>
        </AnimatedSlideIn>

        {hasSavingsGoal ? (
          <View style={{ marginBottom: 20 }}>
            <Text style={{ ...T.fieldLabel, marginBottom: 8 }}>
              {t('onboarding.budget.q14.deductSavingsGoal.label')}
            </Text>
            <Text style={{ ...T.helper, color: C.muted, marginBottom: 12 }}>
              {t('onboarding.budget.q14.deductSavingsGoal.helper')}
            </Text>
            <YesNoToggle
              value={deductSavingsGoal}
              onChange={setDeductSavingsGoal}
              yesLabel={t('onboarding.budget.q14.deductSavingsGoal.yes')}
              noLabel={t('onboarding.budget.q14.deductSavingsGoal.no')}
            />
          </View>
        ) : null}

        <View
          accessibilityLabel={t('onboarding.budget.q14.a11y.previewAmount', {
            frequency: t(`onboarding.budget.q14.previewLabel.${budgetDisplayFrequency}`),
          })}
          style={{
          marginBottom: 20,
          padding: 20,
          borderRadius: R.card,
          backgroundColor: C.surface,
          borderWidth: 1,
          borderColor: C.border,
        }}>
          <FrequencyPills
            options={['daily', 'weekly', 'monthly']}
            value={budgetDisplayFrequency}
            onChange={setBudgetDisplayFrequency}
            label={t('onboarding.budget.q14.displayFrequencyLabel')}
            small
            containerStyle={{ marginBottom: 16 }}
          />

          {liveFlexibleMonthly > 0 ? (
            <View style={{ marginBottom: 16 }}>
              <Text style={{ ...T.fieldLabel, marginBottom: 6 }}>
                {t('onboarding.budget.q14.splitSlider.label')}
              </Text>
              <Text style={{ ...T.caption, color: C.muted, marginBottom: 12 }}>
                {t('onboarding.budget.q14.splitSlider.helper')}
              </Text>
              <BudgetSplitSlider
                value={budgetSpendingRatio}
                onChange={setBudgetSpendingRatio}
                totalAvailable={liveFlexibleMonthly}
              />
              {savingsShift > 0 ? (
                <Text style={{ ...T.caption, color: C.muted, marginTop: 10 }}>
                  {t('onboarding.budget.q14.splitSlider.summary', {
                    spend: formatCurrency(effectiveMonthly, currency),
                    savings: formatCurrency(savingsShift, currency),
                  })}
                </Text>
              ) : null}
            </View>
          ) : null}

          <Text style={{
            fontSize: layout.previewFontSize,
            fontWeight: '700',
            color: effectiveMonthly >= 0 ? C.primary : C.danger,
            ...tabularNums,
          }}>
            {formatCurrency(previewAmount, currency)}
          </Text>
          <Text style={{ ...T.helper, color: C.muted, marginTop: 12 }}>
            {t('onboarding.budget.q14.displayHelper')}
          </Text>
          {hasSavingsGoal && deductSavingsGoal ? (
            <Text style={{ ...T.helper, color: C.muted, marginTop: 8 }}>
              {t('onboarding.budget.q14.deductSavingsGoal.previewNote', {
                deduction: formatCurrency(monthlySavingsRequired, currency),
                amount: formatCurrency(effectiveMonthly, currency),
              })}
            </Text>
          ) : null}
        </View>

        <BudgetExportBar
          onExportCsv={handleExportCsv}
          onExportXlsx={handleExportXlsx}
          onExportPdf={handleExportPdf}
        />
      </View>
    );
  };

  const renderQ14a = () => (
    <View>
      <OptionCard
        icon="♾️"
        label={t('onboarding.budget.q14a.free')}
        subtitle={t('onboarding.budget.q14a.freeDesc')}
        selected={rolloverStrategy === 'free'}
        onPress={() => { setRolloverStrategy('free'); setValidationError(''); }}
      />
      <OptionCard
        icon="🎯"
        label={t('onboarding.budget.q14a.capped')}
        subtitle={t('onboarding.budget.q14a.cappedDesc')}
        selected={rolloverStrategy === 'capped'}
        onPress={() => {
          setRolloverStrategy('capped');
          setValidationError('');
          if (!rolloverMultiplier) setRolloverMultiplier(2);
        }}
      />
      <OptionCard
        icon="🔁"
        label={t('onboarding.budget.q14a.reset')}
        subtitle={t('onboarding.budget.q14a.resetDesc')}
        selected={rolloverStrategy === 'reset'}
        onPress={() => { setRolloverStrategy('reset'); setValidationError(''); }}
      />

      <AnimatedSlideIn visible={rolloverStrategy === 'capped'}>
        <Text style={{ ...T.fieldLabel, color: C.muted, marginTop: 8, marginBottom: 8 }}>
          {t('onboarding.budget.q14a.capTypeLabel')}
        </Text>
        <OptionCard
          label={t('onboarding.budget.q14a.capTypeMultiplier')}
          subtitle={t('onboarding.budget.q14a.capTypeMultiplierHelper')}
          selected={rolloverCapType === 'multiplier'}
          onPress={() => setRolloverCapType('multiplier')}
        />
        <OptionCard
          label={t('onboarding.budget.q14a.capTypeAmount')}
          subtitle={t('onboarding.budget.q14a.capTypeAmountHelper')}
          selected={rolloverCapType === 'amount'}
          onPress={() => setRolloverCapType('amount')}
        />

        <AnimatedSlideIn visible={rolloverCapType === 'multiplier'}>
          <Text style={{ ...T.fieldLabel, color: C.muted, marginTop: 8, marginBottom: S.labelGap }}>
            {t('onboarding.budget.q14a.multiplierLabel')}
          </Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {[2, 3, 4].map((m) => (
              <Pressable
                key={m}
                onPress={() => setRolloverMultiplier(m)}
                accessibilityRole="button"
                accessibilityLabel={t(`onboarding.budget.q14a.multiplier${m}`)}
                accessibilityState={{ selected: rolloverMultiplier === m }}
                style={{
                  minHeight: 44,
                  flex: 1,
                  paddingVertical: S.pillPadV,
                  borderRadius: R.input,
                  borderWidth: 1.5,
                  borderColor: rolloverMultiplier === m ? C.primary : C.border,
                  backgroundColor: rolloverMultiplier === m ? C.chipSelectedBg : C.surface,
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 16, fontWeight: '600', color: rolloverMultiplier === m ? C.primary : C.text }}>
                  ×{m}
                </Text>
              </Pressable>
            ))}
          </View>
        </AnimatedSlideIn>

        <AnimatedSlideIn visible={rolloverCapType === 'amount'}>
          <InputGroup label={t('onboarding.budget.q14a.customCapLabel')} style={{ marginTop: 12 }}>
            <LabeledInput
              value={rolloverCapAmount}
              onChangeText={(v) => setRolloverCapAmount(v.replace(/[^0-9]/g, ''))}
              numeric
              placeholder={t('onboarding.budget.q14a.customCapPlaceholder')}
              large
              inGroup
              currency={currency}
            />
          </InputGroup>
        </AnimatedSlideIn>
      </AnimatedSlideIn>

      <AnimatedSlideIn visible={rolloverStrategy === 'reset'}>
        <Text style={{ ...T.fieldLabel, color: C.muted, marginTop: 8, marginBottom: 8 }}>
          {t('onboarding.budget.q14a.resetDestinationLabel')}
        </Text>
        <Text style={{ ...T.caption, color: C.muted, marginBottom: 12 }}>
          {t('onboarding.budget.q14a.resetDestinationHelper')}
        </Text>
        {[
          { key: 'looseMoney', label: 'resetLooseMoney', helper: 'resetLooseMoneyHelper' },
          { key: 'savings', label: 'resetToSavings', helper: 'resetToSavingsHelper' },
          { key: 'otherGoal', label: 'resetToOtherGoal', helper: 'resetToOtherGoalHelper' },
        ].map((opt) => (
          <OptionCard
            key={opt.key}
            label={t(`onboarding.budget.q14a.${opt.label}`)}
            subtitle={t(`onboarding.budget.q14a.${opt.helper}`)}
            selected={resetUnspentDestination === opt.key}
            onPress={() => {
              setResetUnspentDestination(opt.key);
              setValidationError('');
            }}
          />
        ))}
        <AnimatedSlideIn visible={resetUnspentDestination === 'otherGoal'}>
          <LabeledInput
            label={t('onboarding.budget.q14a.otherGoalLabel')}
            value={resetOtherGoalNote}
            onChangeText={setResetOtherGoalNote}
            placeholder={t('onboarding.budget.q14a.otherGoalPlaceholder')}
            containerStyle={{ marginTop: 4 }}
          />
        </AnimatedSlideIn>
      </AnimatedSlideIn>
    </View>
  );

  const stepTitles = {
    q14: t('onboarding.budget.q14.title'),
    q14a: t('onboarding.budget.q14a.title'),
  };

  return (
    <QuestionScreen
      animationKey={step}
      chapter={t('onboarding.budget.chapter')}
      title={stepTitles[step]}
      onContinue={handleContinue}
      onBack={handleBack}
      validationError={validationError}
      continueDisabled={step === 'q14' && (dataLoading || !!dataError)}
      progress={screenProgress}
      continueLabel={editContinueLabel}
    >
      {step === 'q14' && renderQ14()}
      {step === 'q14a' && renderQ14a()}
    </QuestionScreen>
  );
}
