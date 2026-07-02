import { describe, expect, it } from 'vitest';
import { rowsToCsv } from './csvExport';

describe('rowsToCsv', () => {
  it('returns an empty string for no rows', () => {
    expect(rowsToCsv([])).toBe('');
  });

  it('emits a header row from the first row keys, then data rows', () => {
    const csv = rowsToCsv([
      { title: 'Coffee', amount: 5 },
      { title: 'Rent', amount: 500 },
    ]);
    expect(csv).toBe('title,amount\nCoffee,5\nRent,500');
  });

  it('quotes values containing commas, quotes, or newlines', () => {
    const csv = rowsToCsv([{ title: 'Rent, deposit "held"', notes: 'line1\nline2' }]);
    expect(csv).toBe('title,notes\n"Rent, deposit ""held""","line1\nline2"');
  });

  it('renders null/undefined values as empty strings', () => {
    const csv = rowsToCsv([{ a: null, b: undefined, c: 0 }]);
    expect(csv).toBe('a,b,c\n,,0');
  });
});
