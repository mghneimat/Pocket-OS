import {
  parseStoredDate,
  formatDateDisplay,
} from '../../lib/datePicker';

const t = (key) => {
  const months = {
    'common.months.june': 'June',
    'common.months.december': 'December',
  };
  return months[key] ?? key;
};

describe('parseStoredDate', () => {
  it('parses MM/YYYY when showDay is false', () => {
    expect(parseStoredDate('06/2028', false)).toEqual({
      day: null,
      month: 6,
      year: 2028,
    });
  });

  it('parses DD/MM/YYYY middle segments when showDay is false', () => {
    expect(parseStoredDate('15/06/2028', false)).toEqual({
      day: null,
      month: 6,
      year: 2028,
    });
  });
});

describe('formatDateDisplay', () => {
  it('does not request common.months.undefined for month-only fields', () => {
    expect(formatDateDisplay('15/06/2028', false, t)).toBe('June 2028');
  });

  it('returns raw value when month is out of range', () => {
    expect(formatDateDisplay('99/2028', false, t)).toBe('99/2028');
  });
});
