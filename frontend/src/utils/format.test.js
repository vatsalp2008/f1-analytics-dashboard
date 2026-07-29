import { flagFromCountryCode, formatRaceDate } from './format';

describe('format utilities', () => {
  describe('flagFromCountryCode', () => {
    test('converts 2-letter country code to flag emoji', () => {
      expect(flagFromCountryCode('US')).toBeDefined();
      expect(flagFromCountryCode('US').length).toBeGreaterThan(0);
    });

    test('returns empty string for invalid input', () => {
      expect(flagFromCountryCode('')).toBe('');
      expect(flagFromCountryCode(null)).toBe('');
      expect(flagFromCountryCode(undefined)).toBe('');
      expect(flagFromCountryCode('A')).toBe('');
      expect(flagFromCountryCode('ABC')).toBe('');
    });

    test('converts common country codes', () => {
      const codes = ['AU', 'JP', 'GB', 'BR', 'IT'];
      codes.forEach(code => {
        const result = flagFromCountryCode(code);
        expect(typeof result).toBe('string');
      });
    });

    test('handles lowercase input', () => {
      const upper = flagFromCountryCode('US');
      const lower = flagFromCountryCode('us');
      expect(upper).toBe(lower);
    });
  });

  describe('formatRaceDate', () => {
    test('formats ISO date string correctly', () => {
      expect(formatRaceDate('2025-03-16')).toBe('Mar 16, 2025');
      expect(formatRaceDate('2025-01-01')).toBe('Jan 1, 2025');
      expect(formatRaceDate('2025-12-25')).toBe('Dec 25, 2025');
    });

    test('returns empty string for invalid input', () => {
      expect(formatRaceDate('')).toBe('');
      expect(formatRaceDate(null)).toBe('');
      expect(formatRaceDate(undefined)).toBe('');
      expect(formatRaceDate('invalid')).toBe('');
      expect(formatRaceDate('2025-13-01')).toBe('');
    });

    test('handles different date formats gracefully', () => {
      const result = formatRaceDate('2025-03-16T10:00:00Z');
      expect(result.includes('16')).toBe(true);
      expect(result.includes('2025')).toBe(true);
    });
  });
});
