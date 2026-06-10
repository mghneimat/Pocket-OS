import {
  getIncomeBackTarget,
  hasPriorSalaryIncome,
  resolveInitialIncomeStep,
  validateOtherIncomeContinue,
} from '../../lib/incomeFlow';

describe('resolveInitialIncomeStep', () => {
  it('starts at partner income when user not working but partner is', () => {
    expect(resolveInitialIncomeStep({
      isEditMode: false,
      hasPartner: true,
      userOccupation: 'notWorking',
      partnerOccupation: 'employee',
    })).toBe('q5a');
  });

  it('starts at other income when both are not working', () => {
    expect(resolveInitialIncomeStep({
      isEditMode: false,
      hasPartner: true,
      userOccupation: 'notWorking',
      partnerOccupation: 'notWorking',
    })).toBe('q5b');
  });

  it('starts at other income for solo not-working household', () => {
    expect(resolveInitialIncomeStep({
      isEditMode: false,
      hasPartner: false,
      userOccupation: 'notWorking',
    })).toBe('q5b');
  });
});

describe('validateOtherIncomeContinue', () => {
  const rows = [{ visible: true, amount: '5000', frequency: 'monthly' }];

  it('requires other income when no salary was entered', () => {
    expect(validateOtherIncomeContinue({
      hasPriorSalary: false,
      hasOtherIncome: false,
      otherIncomeRows: rows,
    })).toBe('validationNoIncome');
  });

  it('requires amounts when yes is selected without salary', () => {
    expect(validateOtherIncomeContinue({
      hasPriorSalary: false,
      hasOtherIncome: true,
      otherIncomeRows: [{ visible: true, amount: '' }],
    })).toBe('validationOtherAmount');
  });

  it('allows no when salary exists', () => {
    expect(validateOtherIncomeContinue({
      hasPriorSalary: true,
      hasOtherIncome: false,
      otherIncomeRows: [],
    })).toBeNull();
  });
});

describe('getIncomeBackTarget', () => {
  it('returns splash when backing out of skipped partner-income step', () => {
    expect(getIncomeBackTarget({
      step: 'q5a',
      hasPartner: true,
      isNotWorking: true,
      partnerIsNotWorking: false,
    })).toBe('splash');
  });
});

describe('hasPriorSalaryIncome', () => {
  it('detects partner salary only', () => {
    expect(hasPriorSalaryIncome({
      isNotWorking: true,
      incomeAmount: '',
      hasPartner: true,
      partnerIsNotWorking: false,
      partnerIncomeAmount: '62000',
    })).toBe(true);
  });
});
