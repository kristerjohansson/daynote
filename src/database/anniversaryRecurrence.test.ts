import { describe, expect, it, vi } from 'vitest';
import { getRecurringAnniversaryForDate } from './anniversaryRecurrence';
import { DaynotedataClient } from '.';
import { anniversary } from './anniversaries';

function stubClient(entry: anniversary | undefined): DaynotedataClient {
  return {
    anniversaries: {
      get: vi.fn().mockResolvedValue(entry),
    },
  } as unknown as DaynotedataClient;
}

describe('getRecurringAnniversaryForDate', () => {
  it('returns an empty result when there is no matching entry', async () => {
    const client = stubClient(undefined);

    const result = await getRecurringAnniversaryForDate(client, new Date(2024, 5, 15));

    expect(result).toEqual({ dayMonthKey: 615, items: [], note: '' });
  });

  it('treats a rejected lookup the same as a missing entry', async () => {
    const client = {
      anniversaries: {
        get: vi.fn().mockRejectedValue(new Error('not found')),
      },
    } as unknown as DaynotedataClient;

    const result = await getRecurringAnniversaryForDate(client, new Date(2024, 5, 15));

    expect(result).toEqual({ dayMonthKey: 615, items: [], note: '' });
  });

  it('filters out items whose year is in the future relative to the queried date', async () => {
    const client = stubClient({
      dayMonthKey: 615,
      items: [
        { note: 'Past event', year: 2000 },
        { note: 'Future event', year: 2030 },
      ],
    });

    const result = await getRecurringAnniversaryForDate(client, new Date(2024, 5, 15));

    expect(result.items).toEqual([{ note: 'Past event', year: 2000 }]);
    expect(result.note).toBe('Past event');
  });

  it('trims whitespace, drops empty notes, and dedupes by year+note', async () => {
    const client = stubClient({
      dayMonthKey: 615,
      items: [
        { note: '  Birthday  ', year: 2000 },
        { note: 'Birthday', year: 2000 },
        { note: '   ' },
        { note: '' },
      ],
    });

    const result = await getRecurringAnniversaryForDate(client, new Date(2024, 5, 15));

    expect(result.items).toEqual([{ note: 'Birthday', year: 2000 }]);
  });

  it('sorts items by year (undefined-year first) then alphabetically by note, and joins the combined note', async () => {
    const client = stubClient({
      dayMonthKey: 615,
      items: [
        { note: 'Zebra', year: 2001 },
        { note: 'No year note' },
        { note: 'Apple', year: 2001 },
      ],
    });

    const result = await getRecurringAnniversaryForDate(client, new Date(2024, 5, 15));

    expect(result.items).toEqual([
      { note: 'No year note' },
      { note: 'Apple', year: 2001 },
      { note: 'Zebra', year: 2001 },
    ]);
    expect(result.note).toBe('No year note, Apple, Zebra');
  });
});
