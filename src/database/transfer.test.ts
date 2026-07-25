import { describe, expect, it } from 'vitest';
import { applyDateOffset, DatabaseTransferPayload, parseImportPayload, validateImportPayload } from './transfer';

describe('parseImportPayload - JSON', () => {
  it('parses and validates a well-formed JSON payload', () => {
    const payload: DatabaseTransferPayload = {
      schemaVersion: 1,
      exportedAt: '2024-01-01T00:00:00.000Z',
      notes: [{ date: 1, note: 'hello', photo: '' }],
      anniversaries: [{ dayMonthKey: 105, items: [{ note: 'Birthday', year: 1990 }] }],
    };

    expect(parseImportPayload(JSON.stringify(payload))).toEqual(payload);
  });

  it('throws a descriptive error for malformed JSON', () => {
    expect(() => parseImportPayload('{not valid json')).toThrow('Invalid JSON file.');
  });
});

describe('parseImportPayload - legacy XML', () => {
  const xml = `
    <root>
      <daynotedata>
        <date>2024-01-05</date>
        <note>(null)</note>
        <photo>(null)</photo>
        <anniversary>Mom (1990), Dad</anniversary>
      </daynotedata>
      <daynotedata>
        <date>2024-01-06</date>
        <note>Hello world</note>
        <photo>ffd8ffdb</photo>
        <anniversary>(null)</anniversary>
      </daynotedata>
    </root>
  `;

  it('converts (null) fields to empty strings and only keeps notes with content', () => {
    const result = parseImportPayload(xml);

    expect(result.notes).toEqual([{ date: new Date(2024, 0, 6).valueOf(), note: 'Hello world', photo: expect.any(String) }]);
  });

  it('parses comma-separated legacy anniversary text with "Name (year)" entries', () => {
    const result = parseImportPayload(xml);

    expect(result.anniversaries).toEqual([
      {
        dayMonthKey: 105,
        items: [{ note: 'Dad' }, { note: 'Mom', year: 1990 }],
      },
    ]);
  });

  it('converts a hex-encoded photo to a data URI based on its magic bytes', () => {
    const result = parseImportPayload(xml);

    expect(result.notes[0].photo).toMatch(/^data:image\/jpeg;base64,/);
  });

  it('throws for malformed XML', () => {
    expect(() => parseImportPayload('<root><unclosed></root>')).toThrow('Invalid XML file.');
  });

  it('throws when an entry is missing a date field', () => {
    const missingDate = '<root><daynotedata><note>Hello</note></daynotedata></root>';
    expect(() => parseImportPayload(missingDate)).toThrow('Legacy XML entry is missing a date field.');
  });
});

describe('validateImportPayload', () => {
  it('rejects non-object payloads', () => {
    expect(() => validateImportPayload(null)).toThrow('Import payload must be a JSON object.');
    expect(() => validateImportPayload('foo')).toThrow('Import payload must be a JSON object.');
  });

  it('requires notes to be an array', () => {
    expect(() => validateImportPayload({ notes: 'x', anniversaries: [] })).toThrow('notes must be an array.');
  });

  it('requires anniversaries to be an array', () => {
    expect(() => validateImportPayload({ notes: [], anniversaries: 'x' })).toThrow('anniversaries must be an array.');
  });

  it('rejects duplicate dates in notes', () => {
    const payload = {
      notes: [
        { date: 1, note: 'a', photo: '' },
        { date: 1, note: 'b', photo: '' },
      ],
      anniversaries: [],
    };

    expect(() => validateImportPayload(payload)).toThrow('Duplicate date found in notes payload: 1.');
  });

  it('rejects duplicate dayMonthKeys in anniversaries', () => {
    const payload = {
      notes: [],
      anniversaries: [
        { dayMonthKey: 105, items: [] },
        { dayMonthKey: 105, items: [] },
      ],
    };

    expect(() => validateImportPayload(payload)).toThrow('Duplicate dayMonthKey found in anniversaries payload: 105.');
  });

  it('rejects entries with the wrong field types', () => {
    const payload = { notes: [{ date: 1, note: 42, photo: '' }], anniversaries: [] };
    expect(() => validateImportPayload(payload)).toThrow('notes[0].note must be a string.');
  });

  it('defaults schemaVersion and exportedAt when absent', () => {
    const result = validateImportPayload({ notes: [], anniversaries: [] });
    expect(result.schemaVersion).toBe(1);
    expect(result.exportedAt).toBe(new Date(0).toISOString());
  });
});

describe('applyDateOffset', () => {
  const basePayload: DatabaseTransferPayload = {
    schemaVersion: 1,
    exportedAt: '2024-01-01T00:00:00.000Z',
    notes: [{ date: new Date(2024, 0, 1).valueOf(), note: 'hello', photo: '' }],
    anniversaries: [{ dayMonthKey: 1230, items: [{ note: 'Test', year: 2000 }] }],
  };

  it('returns an equivalent copy when offsetDays is 0', () => {
    expect(applyDateOffset(basePayload, 0)).toEqual(basePayload);
  });

  it('shifts note dates by the exact number of milliseconds', () => {
    const result = applyDateOffset(basePayload, 2);
    expect(result.notes[0].date).toBe(basePayload.notes[0].date + 2 * 24 * 60 * 60 * 1000);
  });

  it('shifts note dates backwards for a negative offset', () => {
    const result = applyDateOffset(basePayload, -1);
    expect(result.notes[0].date).toBe(basePayload.notes[0].date - 24 * 60 * 60 * 1000);
  });

  it('shifts anniversary dayMonthKey and year across a year boundary', () => {
    const result = applyDateOffset(basePayload, 5);

    expect(result.anniversaries).toEqual([{ dayMonthKey: 104, items: [{ note: 'Test', year: 2001 }] }]);
  });
});
