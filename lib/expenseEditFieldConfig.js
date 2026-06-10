/**
 * Onboarding-aligned field config per expense editKind.
 * Keys reference lib/locales onboarding.* paths.
 */

/** @typedef {'amount'|'frequency'|'date'|'toggle'|'text'|'number'} ExpenseFieldType */

/**
 * @param {string} editKind
 * @param {object|null} editRef
 * @returns {object[]}
 */
export function getExpenseEditFields(editKind, editRef = null) {
  switch (editKind) {
    case 'subscription':
      return [
        { type: 'amount', labelKey: 'onboarding.subscriptions.q11.amountLabel', placeholderKey: 'onboarding.subscriptions.q11.amountPlaceholder', inGroup: true },
        { type: 'frequency', options: ['monthly', 'quarterly', 'annual'] },
        { type: 'toggle', key: 'autoRenews', labelKey: 'onboarding.subscriptions.q11.autoRenewLabel' },
        { type: 'date', key: 'renewalDate', labelKey: 'onboarding.subscriptions.q11.renewalLabel', showDay: true },
      ];
    case 'debt':
      return [
        { type: 'amount', key: 'balance', labelKey: 'onboarding.debts.q13a.balanceLabel', placeholderKey: 'onboarding.debts.q13a.balancePlaceholder', inGroup: true },
        { type: 'amount', key: 'minPayment', labelKey: 'onboarding.debts.q13a.minPaymentLabel', placeholderKey: 'onboarding.debts.q13a.minPaymentPlaceholder', inGroup: true },
        { type: 'text', key: 'apr', labelKey: 'onboarding.debts.q13a.aprLabel', placeholderKey: 'onboarding.debts.q13a.aprPlaceholder', numeric: true },
        { type: 'date', key: 'promoEndDate', labelKey: 'onboarding.debts.q13a.promoEndLabel', showDay: false },
        { type: 'number', key: 'paymentDueDay', labelKey: 'onboarding.debts.q13a.dueDayLabel', placeholderKey: 'onboarding.debts.q13a.dueDayPlaceholder' },
      ];
    case 'health_member':
      return [
        { type: 'amount', labelKey: 'onboarding.health.premiumLabel', placeholderKey: 'onboarding.health.premiumPlaceholder', inGroup: true },
        { type: 'frequency', options: ['monthly', 'quarterly', 'annual', 'custom'] },
        { type: 'number', key: 'customFrequencyMonths', labelKey: 'onboarding.health.customFrequencyLabel', showWhen: { field: 'frequency', value: 'custom' } },
        { type: 'date', key: 'endDate', labelKey: 'onboarding.health.endDateLabel', showDay: true },
      ];
    case 'housing_rent':
      return [
        { type: 'amount', labelKey: 'onboarding.housing.q6a.amountLabel', inGroup: true },
      ];
    case 'housing_utilities':
      return [
        { type: 'amount', labelKey: 'onboarding.housing.q6b.amountLabel', inGroup: true },
      ];
    case 'housing_internet':
      return [
        { type: 'amount', labelKey: 'onboarding.housing.q6c.amountLabel', inGroup: true },
        { type: 'frequency', options: ['monthly', 'annual'] },
      ];
    case 'housing_mortgage':
      return [
        { type: 'amount', labelKey: 'onboarding.housing.q6e.amountLabel', inGroup: true },
        { type: 'date', key: 'mortgageEndDate', labelKey: 'onboarding.housing.q6e.endDateLabel', showDay: false },
      ];
    case 'housing_govt_tax':
      return [
        { type: 'amount', labelKey: 'onboarding.housing.q6g.customAmountLabel', inGroup: true, annualNote: true },
      ];
    case 'housing_govt_custom':
      return [
        { type: 'text', key: 'label', labelKey: 'onboarding.housing.q6g.customPlaceholder', inGroup: true },
        { type: 'amount', labelKey: 'onboarding.housing.q6g.customAmountLabel', inGroup: true },
        { type: 'frequency', options: ['monthly', 'annual'] },
      ];
    case 'housing_other_row':
      return [
        { type: 'text', key: 'description', labelKey: 'onboarding.housing.q6f.descriptionPlaceholder', inGroup: true },
        { type: 'amount', labelKey: 'onboarding.housing.q6f.amountLabel', inGroup: true },
        { type: 'date', key: 'dueDate', labelKey: 'onboarding.housing.q6f.dueDateLabel', showDay: false },
      ];
    case 'housing_family_row':
      return [
        { type: 'text', key: 'description', labelKey: 'onboarding.housing.q6h.descriptionPlaceholder', inGroup: true },
        { type: 'amount', labelKey: 'onboarding.housing.q6h.amountLabel', inGroup: true },
        { type: 'date', key: 'dueDate', labelKey: 'onboarding.housing.q6h.dueDateLabel', showDay: false },
      ];
    case 'pet': {
      const field = editRef?.field || 'food';
      const labelKey = field === 'vet'
        ? 'onboarding.pets.q10a.vetLabel'
        : 'onboarding.pets.q10a.foodLabel';
      return [
        { type: 'amount', labelKey, inGroup: true },
        { type: 'frequency', options: ['monthly', 'quarterly', 'annual'] },
      ];
    }
    case 'transport_vehicle': {
      const field = editRef?.field || 'fuel';
      if (field === 'fuel') {
        return [
          { type: 'amount', labelKey: 'onboarding.transport.q7a.costLabel', inGroup: true },
        ];
      }
      if (field === 'insurance') {
        return [
          { type: 'amount', labelKey: 'onboarding.transport.q7b.premiumLabel', inGroup: true },
          { type: 'frequency', options: ['monthly', 'annual'] },
          { type: 'date', key: 'insuranceRenewalDate', labelKey: 'onboarding.transport.q7b.renewalLabel', showDay: false },
        ];
      }
      return [
        { type: 'amount', labelKey: 'onboarding.transport.q7c.amountLabel', inGroup: true },
        { type: 'frequency', options: ['monthly', 'annual'] },
      ];
    }
    case 'transport_public':
      return [
        { type: 'amount', labelKey: 'onboarding.transport.q7e.amountLabel', inGroup: true },
        { type: 'frequency', options: ['daily', 'weekly', 'monthly', 'annual'] },
        { type: 'date', key: 'ptValidUntil', labelKey: 'onboarding.transport.q7e.validUntilLabel', showDay: false },
      ];
    case 'child_cost': {
      const fieldKey = editRef?.fieldKey || 'other';
      return [
        { type: 'amount', labelKey: `onboarding.childrenCosts.q9.field.${fieldKey}`, placeholderKey: 'onboarding.childrenCosts.q9.amountPlaceholder', inGroup: true },
        { type: 'frequency', options: ['monthly', 'quarterly', 'annual'] },
      ];
    }
    case 'other_cost':
      return [
        { type: 'amount', labelKey: 'onboarding.otherCosts.q12.amountLabel', placeholderKey: 'onboarding.otherCosts.q12.amountPlaceholder', inGroup: true },
        { type: 'frequency', options: ['monthly', 'quarterly', 'annual'] },
        { type: 'date', key: 'dueDate', labelKey: 'onboarding.otherCosts.q12.dueDateLabel', showDay: true },
      ];
    default:
      return [
        { type: 'amount', labelKey: 'dashboard.expensesScreen.edit.amount', inGroup: true },
        { type: 'frequency', options: ['monthly', 'quarterly', 'annual'] },
      ];
  }
}

/**
 * Build initial form values from a dashboard expense row + stored source.
 * @param {object} row
 */
export function buildExpenseFormState(row) {
  const source = row.source || {};
  const amountKey = row.editKind === 'debt' ? 'minPayment' : 'amount';
  const baseAmount = row.editKind === 'subscription'
    ? source.cost
    : row.editKind === 'debt'
      ? source.minPayment
      : row.editKind === 'health_member'
        ? source.premium ?? source.member?.premium
        : row.rawAmount;

  const state = {
    amount: baseAmount != null ? String(baseAmount) : '',
    frequency: row.frequency || source.frequency || 'monthly',
    renewalDate: row.renewalDate || source.renewalDate || '',
    dueDate: row.dueDate || source.dueDate || '',
    endDate: row.endDate || source.endDate || source.member?.endDate || '',
    autoRenews: source.autoRenews !== false,
    balance: source.balance != null ? String(source.balance) : '',
    minPayment: source.minPayment != null ? String(source.minPayment) : String(row.rawAmount || ''),
    apr: source.apr != null ? String(source.apr) : '',
    promoEndDate: source.promoEndDate || row.dueDate || '',
    paymentDueDay: source.paymentDueDay != null ? String(source.paymentDueDay) : '',
    customFrequencyMonths: source.customFrequencyMonths != null ? String(source.customFrequencyMonths) : '',
    mortgageEndDate: source.mortgageEndDate || '',
    insuranceRenewalDate: source.insuranceRenewalDate || row.renewalDate || '',
    ptValidUntil: source.ptValidUntil || '',
    description: source.description || source.row?.description || source.row?.label || '',
    label: source.label || source.item?.label || '',
  };

  if (row.editKind === 'housing_rent' && source.rent != null) {
    state.amount = String(source.rent);
  }
  if (row.editKind === 'housing_utilities' && source.utilities != null) {
    state.amount = String(source.utilities);
  }
  if (row.editKind === 'housing_internet') {
    if (source.internetAmount != null) state.amount = String(source.internetAmount);
    state.frequency = source.internetFrequency || state.frequency;
  }
  if (row.editKind === 'housing_mortgage') {
    if (source.mortgageAmount != null) state.amount = String(source.mortgageAmount);
    state.mortgageEndDate = source.mortgageEndDate || '';
  }

  if (row.editKind === 'housing_other_row' || row.editKind === 'housing_family_row') {
    const rowData = source.row || source;
    state.amount = rowData.amount != null ? String(rowData.amount) : state.amount;
    state.dueDate = rowData.dueDate || state.dueDate;
    state.description = rowData.description || rowData.label || state.description;
  }

  if (row.editKind === 'housing_govt_custom') {
    state.amount = source.item?.amount != null ? String(source.item.amount) : state.amount;
    state.label = source.item?.label || state.label;
    state.frequency = source.item?.frequency || state.frequency;
  }

  if (row.editKind === 'pet') {
    const field = row.editRef?.field;
    if (field === 'food') {
      state.amount = source.pet?.foodAmount != null ? String(source.pet.foodAmount) : state.amount;
      state.frequency = source.pet?.foodFrequency || state.frequency;
    } else if (field === 'vet') {
      state.amount = source.pet?.vetAmount != null ? String(source.pet.vetAmount) : state.amount;
      state.frequency = source.pet?.vetFrequency || state.frequency;
    }
  }

  if (row.editKind === 'transport_vehicle') {
    const v = source.vehicle || {};
    const field = row.editRef?.field;
    if (field === 'fuel') state.amount = v.fuelCost != null ? String(v.fuelCost) : state.amount;
    if (field === 'insurance') {
      state.amount = v.insurancePremium != null ? String(v.insurancePremium) : state.amount;
      state.frequency = v.insuranceFrequency || state.frequency;
      state.insuranceRenewalDate = v.insuranceRenewalDate || '';
    }
    if (field === 'parking') {
      state.amount = v.parkingAmount != null ? String(v.parkingAmount) : state.amount;
      state.frequency = v.parkingFrequency || state.frequency;
    }
  }

  if (row.editKind === 'child_cost') {
    state.amount = source.field?.amount != null ? String(source.field.amount) : state.amount;
    state.frequency = source.field?.frequency || state.frequency;
  }

  if (row.editKind === 'health_member') {
    const member = source.member || source;
    if (member.premium != null) state.amount = String(member.premium);
    state.frequency = member.frequency || state.frequency;
    state.endDate = member.endDate || state.endDate;
    state.customFrequencyMonths = member.customFrequencyMonths != null
      ? String(member.customFrequencyMonths)
      : state.customFrequencyMonths;
  }

  if (row.editKind === 'transport_public') {
    if (source.ptAmount != null) state.amount = String(source.ptAmount);
    state.frequency = source.ptFrequency || state.frequency;
    state.ptValidUntil = source.ptValidUntil || '';
  }

  return state;
}

/**
 * Map form state to patchExpenseRow / addExpenseForCategory fields.
 * @param {object} row
 * @param {object} form
 */
export function formStateToPatchFields(row, form) {
  const primaryAmount = row.editKind === 'debt' ? form.minPayment : form.amount;
  const date = form.endDate || form.dueDate || form.renewalDate
    || form.promoEndDate || form.insuranceRenewalDate || form.ptValidUntil
    || form.mortgageEndDate || '';

  return {
    amount: primaryAmount,
    frequency: form.frequency,
    date,
    extra: form,
  };
}
