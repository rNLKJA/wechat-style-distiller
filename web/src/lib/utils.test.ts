import { describe, it, expect } from 'vitest';
import { cn, formatPercent, formatNumber, truncate } from './utils';

describe('utils', () => {
  describe('cn', () => {
    it('merges class names', () => {
      expect(cn('foo', 'bar')).toBe('foo bar');
    });

    it('handles conditional classes', () => {
      expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz');
    });

    it('merges Tailwind classes correctly', () => {
      expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4');
    });
  });

  describe('formatPercent', () => {
    it('formats as percentage with default decimals', () => {
      expect(formatPercent(0.4)).toBe('40%');
      expect(formatPercent(0.125)).toBe('13%');
    });

    it('formats with specified decimals', () => {
      expect(formatPercent(0.4567, 2)).toBe('45.67%');
    });
  });

  describe('formatNumber', () => {
    it('formats with default 1 decimal', () => {
      expect(formatNumber(3.14159)).toBe('3.1');
    });

    it('formats with specified decimals', () => {
      expect(formatNumber(3.14159, 3)).toBe('3.142');
      expect(formatNumber(42, 0)).toBe('42');
    });
  });

  describe('truncate', () => {
    it('returns string unchanged if under limit', () => {
      expect(truncate('hello', 10)).toBe('hello');
    });

    it('truncates long strings with ellipsis', () => {
      expect(truncate('hello world', 8)).toBe('hello...');
    });

    it('handles exact length', () => {
      expect(truncate('hello', 5)).toBe('hello');
    });
  });
});
