import { getData, setData } from './storage';
import { notifyDashboardRefresh } from './dashboardRefresh';
import { parseAmount } from './sectionEditStorage';

async function persist(key, next) {
  await setData(key, next);
  notifyDashboardRefresh();
}

async function patchHousing(mutator) {
  const housing = { ...((await getData('pocketos_housing')) || {}) };
  await persist('pocketos_housing', mutator(housing));
}

async function patchTransport(mutator) {
  const transport = { ...((await getData('pocketos_transport')) || {}) };
  await persist('pocketos_transport', mutator(transport));
}

async function patchHealth(mutator) {
  const health = { ...((await getData('pocketos_health')) || {}) };
  await persist('pocketos_health', mutator(health));
}

/**
 * @param {number} index
 * @param {{ cost: string, frequency: string, renewalDate?: string|null }} fields
 */
export async function patchSubscription(index, { cost, frequency, renewalDate, autoRenews }) {
  const subs = [...((await getData('pocketos_subscriptions')) || [])];
  if (!subs[index]) return;
  subs[index] = {
    ...subs[index],
    cost: parseAmount(cost),
    frequency: frequency || 'monthly',
    ...(renewalDate !== undefined ? { renewalDate: renewalDate || null } : {}),
    ...(autoRenews !== undefined ? { autoRenews } : {}),
  };
  await persist('pocketos_subscriptions', subs);
}

/**
 * @param {number} index
 * @param {{ minPayment: string, frequency?: string, promoEndDate?: string|null }} fields
 */
export async function patchDebtMinPayment(index, {
  minPayment,
  frequency,
  promoEndDate,
  balance,
  apr,
  paymentDueDay,
}) {
  const debts = [...((await getData('pocketos_debts')) || [])];
  if (!debts[index]) return;
  debts[index] = {
    ...debts[index],
    minPayment: parseAmount(minPayment),
    ...(balance !== undefined ? { balance: parseAmount(balance) } : {}),
    ...(apr !== undefined ? { apr: parseFloat(apr) || 0 } : {}),
    ...(paymentDueDay !== undefined && paymentDueDay !== ''
      ? { paymentDueDay: parseInt(paymentDueDay, 10) || null }
      : {}),
    ...(frequency ? { frequency } : {}),
    ...(promoEndDate !== undefined ? { promoEndDate: promoEndDate || null } : {}),
  };
  await persist('pocketos_debts', debts);
}

/**
 * @param {string} memberKey
 * @param {{ premium: string, frequency: string, endDate?: string|null }} fields
 */
export async function patchHealthMember(memberKey, { premium, frequency, endDate, customFrequencyMonths }) {
  await patchHealth((health) => ({
    ...health,
    [memberKey]: {
      ...(health[memberKey] || {}),
      premium: parseAmount(premium),
      frequency: frequency || 'monthly',
      confirmed: true,
      ...(endDate !== undefined ? { endDate: endDate || null } : {}),
      ...(customFrequencyMonths !== undefined && customFrequencyMonths !== ''
        ? { customFrequencyMonths: parseInt(customFrequencyMonths, 10) || null }
        : {}),
    },
  }));
}

/**
 * @param {number} index
 * @param {'food'|'vet'} field
 * @param {{ amount: string, frequency: string }} fields
 */
export async function patchPetCost(index, field, { amount, frequency }) {
  const pets = [...((await getData('pocketos_pets')) || [])];
  if (!pets[index]) return;
  const pet = { ...pets[index] };
  if (field === 'food') {
    pet.foodAmount = parseAmount(amount);
    pet.foodFrequency = frequency || 'monthly';
  } else {
    pet.vetAmount = parseAmount(amount);
    pet.vetFrequency = frequency || 'monthly';
  }
  pets[index] = pet;
  await persist('pocketos_pets', pets);
}

/**
 * @param {number} index
 * @param {{ amount: string, frequency: string, dueDate?: string|null }} fields
 */
export async function patchOtherCost(index, { amount, frequency, dueDate }) {
  const costs = [...((await getData('pocketos_other_costs')) || [])];
  if (!costs[index]) return;
  costs[index] = {
    ...costs[index],
    amount: parseAmount(amount),
    frequency: frequency || 'monthly',
    ...(dueDate !== undefined ? { dueDate: dueDate || null } : {}),
  };
  await persist('pocketos_other_costs', costs);
}

/**
 * @param {string} childKey
 * @param {string} fieldKey
 * @param {{ amount: string, frequency: string }} fields
 */
export async function patchChildCost(childKey, fieldKey, { amount, frequency }) {
  const costs = { ...((await getData('pocketos_children_costs')) || {}) };
  costs[childKey] = {
    ...(costs[childKey] || {}),
    [fieldKey]: {
      ...(costs[childKey]?.[fieldKey] || {}),
      amount: parseAmount(amount),
      frequency: frequency || 'monthly',
    },
  };
  await persist('pocketos_children_costs', costs);
}

/**
 * @param {{ editKind: string, editRef?: object, editIndex?: number }} row
 * @param {{ amount: string, frequency?: string, date?: string|null }} fields
 */
export async function patchExpenseRow(row, fields) {
  const ref = row.editRef || {};
  const extra = fields.extra || {};
  const amount = fields.amount;
  const frequency = fields.frequency;
  const date = fields.date;

  switch (row.editKind) {
    case 'subscription':
      return patchSubscription(ref.index ?? row.editIndex, {
        cost: amount,
        frequency,
        renewalDate: extra.renewalDate ?? date,
        autoRenews: extra.autoRenews,
      });
    case 'debt':
      return patchDebtMinPayment(ref.index ?? row.editIndex, {
        minPayment: extra.minPayment ?? amount,
        balance: extra.balance,
        apr: extra.apr,
        paymentDueDay: extra.paymentDueDay,
        frequency,
        promoEndDate: extra.promoEndDate ?? date,
      });
    case 'housing_rent':
      return patchHousing((h) => ({ ...h, rent: parseAmount(amount) }));
    case 'housing_utilities':
      return patchHousing((h) => ({ ...h, utilities: parseAmount(amount) }));
    case 'housing_internet':
      return patchHousing((h) => ({
        ...h,
        hasInternet: true,
        internetAmount: parseAmount(amount),
        internetFrequency: frequency || 'monthly',
      }));
    case 'housing_mortgage':
      return patchHousing((h) => ({
        ...h,
        hasMortgage: true,
        mortgageAmount: parseAmount(amount),
        ...(extra.mortgageEndDate !== undefined
          ? { mortgageEndDate: extra.mortgageEndDate || null }
          : {}),
      }));
    case 'housing_govt_tax':
      return patchHousing((h) => ({
        ...h,
        govtTaxes: {
          ...(h.govtTaxes || {}),
          [ref.amountField]: parseAmount(amount),
          [ref.flagField]: true,
        },
      }));
    case 'housing_govt_custom':
      return patchHousing((h) => {
        const items = [...(h.govtTaxes?.customItems || [])];
        if (!items[ref.index]) return h;
        items[ref.index] = {
          ...items[ref.index],
          label: extra.label ?? items[ref.index].label,
          amount: parseAmount(amount),
          frequency: frequency || 'annual',
        };
        return { ...h, govtTaxes: { ...(h.govtTaxes || {}), customItems: items } };
      });
    case 'housing_other_row':
      return patchHousing((h) => {
        const rows = [...(h.otherCostRows || [])];
        if (!rows[ref.index]) return h;
        rows[ref.index] = {
          ...rows[ref.index],
          amount: parseAmount(amount),
          description: extra.description ?? rows[ref.index].description,
          dueDate: extra.dueDate ?? rows[ref.index].dueDate,
        };
        return { ...h, hasOtherCosts: true, otherCostRows: rows };
      });
    case 'housing_family_row':
      return patchHousing((h) => {
        const rows = [...(h.familyContributionRows || [])];
        if (!rows[ref.index]) return h;
        rows[ref.index] = {
          ...rows[ref.index],
          amount: parseAmount(amount),
          description: extra.description ?? rows[ref.index].description,
          dueDate: extra.dueDate ?? rows[ref.index].dueDate,
        };
        return { ...h, contributesToFamily: true, familyContributionRows: rows };
      });
    case 'health_member':
      return patchHealthMember(ref.memberKey, {
        premium: amount,
        frequency,
        endDate: extra.endDate ?? date,
        customFrequencyMonths: extra.customFrequencyMonths,
      });
    case 'pet':
      return patchPetCost(ref.index, ref.field, { amount, frequency });
    case 'transport_vehicle':
      return patchTransport((t) => {
        const vehicles = [...(t.vehicles || [])];
        if (!vehicles[ref.vehicleIndex]) return t;
        const v = { ...vehicles[ref.vehicleIndex] };
        if (ref.field === 'fuel') {
          v.fuelCost = parseAmount(amount);
        } else if (ref.field === 'insurance') {
          v.insurancePremium = parseAmount(amount);
          v.insuranceFrequency = frequency || 'annual';
          v.hasInsurance = true;
          if (extra.insuranceRenewalDate !== undefined || date !== undefined) {
            v.insuranceRenewalDate = extra.insuranceRenewalDate ?? date ?? null;
          }
        } else if (ref.field === 'parking') {
          v.parkingAmount = parseAmount(amount);
          v.parkingFrequency = frequency || 'monthly';
          v.hasParking = true;
        }
        vehicles[ref.vehicleIndex] = v;
        return { ...t, hasVehicle: true, vehicles };
      });
    case 'transport_public':
      return patchTransport((t) => ({
        ...t,
        hasPublicTransport: true,
        ptAmount: parseAmount(amount),
        ptFrequency: frequency || 'monthly',
        ...(extra.ptValidUntil !== undefined ? { ptValidUntil: extra.ptValidUntil || null } : {}),
      }));
    case 'child_cost':
      return patchChildCost(ref.childKey, ref.fieldKey, { amount, frequency });
    case 'other_cost':
      return patchOtherCost(ref.index, {
        amount,
        frequency,
        dueDate: extra.dueDate ?? date,
      });
    default:
      throw new Error(`Unsupported expense edit kind: ${row.editKind}`);
  }
}

/**
 * Create a new expense line for an empty sub-tab (inline add, same page).
 * @param {string} categoryKey
 * @param {{ amount: string, frequency?: string, date?: string|null }} fields
 */
export async function addExpenseForCategory(categoryKey, fields) {
  const amount = fields.amount;
  const frequency = fields.frequency || 'monthly';
  const date = fields.date;

  switch (categoryKey) {
    case 'rent':
      return patchHousing((h) => ({
        ...h,
        type: h.type || 'renting',
        rent: parseAmount(amount),
      }));
    case 'utilities':
      return patchHousing((h) => ({
        ...h,
        type: h.type || 'renting',
        utilities: parseAmount(amount),
      }));
    case 'health_insurance':
      return patchHealthMember('user', { premium: amount, frequency, endDate: date });
    case 'waste_tax':
      return patchHousing((h) => ({
        ...h,
        govtTaxes: {
          ...(h.govtTaxes || {}),
          wasteTax: true,
          wasteTaxAmount: parseAmount(amount),
        },
      }));
    case 'tv_licence':
      return patchHousing((h) => ({
        ...h,
        govtTaxes: {
          ...(h.govtTaxes || {}),
          tvLicence: true,
          tvLicenceAmount: parseAmount(amount),
        },
      }));
    case 'radio_licence':
      return patchHousing((h) => ({
        ...h,
        govtTaxes: {
          ...(h.govtTaxes || {}),
          radioLicence: true,
          radioLicenceAmount: parseAmount(amount),
        },
      }));
    case 'subscriptions': {
      const subs = [...((await getData('pocketos_subscriptions')) || [])];
      subs.push({
        name: 'other',
        cost: parseAmount(amount),
        frequency,
        renewalDate: date || null,
      });
      return persist('pocketos_subscriptions', subs);
    }
    case 'internet':
      return patchHousing((h) => ({
        ...h,
        hasInternet: true,
        internetAmount: parseAmount(amount),
        internetFrequency: frequency,
      }));
    case 'pets': {
      const pets = [...((await getData('pocketos_pets')) || [])];
      if (!pets.length) {
        pets.push({
          name: '',
          foodAmount: parseAmount(amount),
          foodFrequency: frequency,
        });
      } else {
        const pet = { ...pets[0] };
        pet.foodAmount = parseAmount(amount);
        pet.foodFrequency = frequency;
        pets[0] = pet;
      }
      return persist('pocketos_pets', pets);
    }
    case 'mortgage':
      return patchHousing((h) => ({
        ...h,
        hasMortgage: true,
        mortgageAmount: parseAmount(amount),
      }));
    case 'transport':
      return patchTransport((t) => ({
        ...t,
        hasPublicTransport: true,
        ptAmount: parseAmount(amount),
        ptFrequency: frequency,
      }));
    case 'children':
      return patchChildCost('child_0', 'other', { amount, frequency });
    case 'debts': {
      const debts = [...((await getData('pocketos_debts')) || [])];
      debts.push({
        type: 'other',
        balance: 0,
        minPayment: parseAmount(amount),
        apr: 0,
        promoEndDate: date || null,
      });
      return persist('pocketos_debts', debts);
    }
    case 'housing_other':
      return patchHousing((h) => {
        const rows = [...(h.otherCostRows || [])];
        rows.push({ amount: parseAmount(amount), label: null, description: null });
        return { ...h, hasOtherCosts: true, otherCostRows: rows };
      });
    case 'family_contribution':
      return patchHousing((h) => {
        const rows = [...(h.familyContributionRows || [])];
        rows.push({ amount: parseAmount(amount), description: null });
        return {
          ...h,
          type: h.type || 'family',
          contributesToFamily: true,
          familyContributionRows: rows,
        };
      });
    case 'other': {
      const costs = [...((await getData('pocketos_other_costs')) || [])];
      costs.push({
        name: 'other',
        amount: parseAmount(amount),
        frequency,
        dueDate: date || null,
      });
      return persist('pocketos_other_costs', costs);
    }
    case 'custom_taxes':
      return patchHousing((h) => {
        const items = [...(h.govtTaxes?.customItems || [])];
        items.push({
          label: null,
          amount: parseAmount(amount),
          frequency: frequency || 'annual',
        });
        return { ...h, govtTaxes: { ...(h.govtTaxes || {}), customItems: items } };
      });
    default:
      throw new Error(`Unsupported expense add category: ${categoryKey}`);
  }
}
