import {
  DEFAULT_WASTE_TAX_FULL_RATE,
  estimateAnnualWasteTax,
  getHouseholdWasteTaxMembers,
  shouldEstimateCzechWasteTax,
} from '../../lib/wasteTax';

describe('estimateAnnualWasteTax', () => {
  it('charges one adult for solo household', () => {
    expect(estimateAnnualWasteTax({ type: 'solo', children: [] })).toBe(DEFAULT_WASTE_TAX_FULL_RATE);
  });

  it('charges two adults for partner household', () => {
    expect(estimateAnnualWasteTax({
      type: 'partner',
      partnerName: 'Alex',
      children: [],
    })).toBe(DEFAULT_WASTE_TAX_FULL_RATE * 2);
  });

  it('applies reduced and exempt child rates', () => {
    expect(estimateAnnualWasteTax({
      type: 'partner',
      partnerName: 'Alex',
      children: [
        { ageGroup: '6-15' },
        { ageGroup: '0-2' },
        { ageGroup: '16-18' },
      ],
    })).toBe(DEFAULT_WASTE_TAX_FULL_RATE * 2 + DEFAULT_WASTE_TAX_FULL_RATE * 0.5 + 0 + DEFAULT_WASTE_TAX_FULL_RATE);
  });

  it('estimates household of four with two school-age children', () => {
    expect(estimateAnnualWasteTax({
      type: 'partner',
      partnerName: 'Alex',
      children: [
        { ageGroup: '6-15' },
        { ageGroup: '3-5' },
      ],
    })).toBe(2160 + 1080);
  });
});

describe('getHouseholdWasteTaxMembers', () => {
  it('counts partner as second adult', () => {
    expect(getHouseholdWasteTaxMembers({ type: 'partner', partnerName: 'Alex' }).adultCount).toBe(2);
  });
});

describe('shouldEstimateCzechWasteTax', () => {
  it('detects Czech location by country code', () => {
    expect(shouldEstimateCzechWasteTax({ country: 'CZ', currency: 'CZK' })).toBe(true);
  });

  it('skips non-Czech locations', () => {
    expect(shouldEstimateCzechWasteTax({ country: 'DE', currency: 'EUR' })).toBe(false);
  });
});
