import { describe, expect, it } from 'vitest';
import { getAnniversariesId, getDayMonthKeyFromDate, parseDayMonthKey } from './anniversaries';

describe('getDayMonthKeyFromDate', () => {
  it('encodes month and day as month * 100 + day', () => {
    expect(getDayMonthKeyFromDate(new Date(2024, 0, 5))).toBe(105);
    expect(getDayMonthKeyFromDate(new Date(2024, 11, 25))).toBe(1225);
  });

  it('ignores the year component', () => {
    expect(getDayMonthKeyFromDate(new Date(1990, 5, 15))).toBe(getDayMonthKeyFromDate(new Date(2030, 5, 15)));
  });
});

describe('parseDayMonthKey', () => {
  it('is the inverse of getDayMonthKeyFromDate', () => {
    expect(parseDayMonthKey(105)).toEqual({ month: 1, day: 5 });
    expect(parseDayMonthKey(1225)).toEqual({ month: 12, day: 25 });
  });
});

describe('getAnniversariesId', () => {
  it('passes a numeric argument through unchanged', () => {
    expect(getAnniversariesId(1225)).toBe(1225);
  });

  it('extracts dayMonthKey from an object argument', () => {
    expect(getAnniversariesId({ dayMonthKey: 105 })).toBe(105);
  });
});
