import { describe, expect, it } from 'vitest';
import { getFirstDateOfWeek, getLastWeekNumberOfYear, getWeekDates, getWeekNumber } from './DateExtensions';

describe('getWeekNumber', () => {
  it('returns week 1 for the first Monday of a year that starts mid-week', () => {
    // 2024-01-01 is a Monday, so it starts ISO week 1 of 2024.
    expect(getWeekNumber(new Date(2024, 0, 1))).toBe(1);
  });

  it('assigns the last days of December to week 1 of the following year', () => {
    // 2018-12-31 is a Monday and belongs to ISO week 1 of 2019.
    expect(getWeekNumber(new Date(2018, 11, 31))).toBe(1);
  });

  it('assigns the first days of January to week 53 of the previous year', () => {
    // 2021-01-01 is a Friday and belongs to ISO week 53 of 2020.
    expect(getWeekNumber(new Date(2021, 0, 1))).toBe(53);
  });

  it('handles a leap year correctly', () => {
    // 2020-12-31 is a Thursday and belongs to ISO week 53 of 2020.
    expect(getWeekNumber(new Date(2020, 11, 31))).toBe(53);
  });
});

describe('getLastWeekNumberOfYear', () => {
  it('returns 52 for a regular 52-week year', () => {
    expect(getLastWeekNumberOfYear(2021)).toBe(52);
  });

  it('returns 53 for a long (53-week) ISO year', () => {
    expect(getLastWeekNumberOfYear(2020)).toBe(53);
  });
});

describe('getFirstDateOfWeek', () => {
  it('round-trips with getWeekNumber for a regular week', () => {
    const firstDate = getFirstDateOfWeek(2024, 10);
    expect(getWeekNumber(firstDate)).toBe(10);
    expect(firstDate.getDay()).toBe(1); // Monday
  });

  it('round-trips for ISO week 1 of a year that starts mid-week', () => {
    const firstDate = getFirstDateOfWeek(2024, 1);
    expect(firstDate).toEqual(new Date(2024, 0, 1));
    expect(getWeekNumber(firstDate)).toBe(1);
  });

  it('round-trips for the last (53rd) week of a long ISO year', () => {
    const firstDate = getFirstDateOfWeek(2020, 53);
    expect(getWeekNumber(firstDate)).toBe(53);
    expect(firstDate.getDay()).toBe(1);
  });

  it('round-trips for week 52 of a year immediately preceding a long year', () => {
    const firstDate = getFirstDateOfWeek(2019, 52);
    expect(getWeekNumber(firstDate)).toBe(52);
  });
});

describe('getWeekDates', () => {
  it('returns 7 consecutive calendar dates starting on the Monday of that ISO week', () => {
    const dates = getWeekDates(2024, 10);
    expect(dates).toHaveLength(7);
    expect(dates[0].getDay()).toBe(1); // Monday

    for (let i = 1; i < dates.length; i += 1) {
      const previous = dates[i - 1];
      const current = dates[i];
      const diffInDays = (current.valueOf() - previous.valueOf()) / (24 * 60 * 60 * 1000);
      expect(diffInDays).toBe(1);
    }

    expect(dates.every(date => getWeekNumber(date) === 10)).toBe(true);
  });

  it('spans a year boundary correctly for the last week of a long ISO year', () => {
    const dates = getWeekDates(2020, 53);
    expect(dates[0]).toEqual(new Date(2020, 11, 28));
    expect(dates[6]).toEqual(new Date(2021, 0, 3));
  });
});
