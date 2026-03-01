import { describe, it, expect } from 'vitest';
import { capitalizeFirst } from './string';

describe('string utils', () => {
  describe('capitalizeFirst', () => {
    it('should capitalize the first letter', () => {
      expect(capitalizeFirst('hello')).toBe('Hello');
    });

    it('should handle already capitalized strings', () => {
      expect(capitalizeFirst('Hello')).toBe('Hello');
    });

    it('should handle single character strings', () => {
      expect(capitalizeFirst('a')).toBe('A');
    });

    it('should handle empty strings', () => {
      expect(capitalizeFirst('')).toBe('');
    });

    it('should handle priority values', () => {
      expect(capitalizeFirst('high')).toBe('High');
      expect(capitalizeFirst('medium')).toBe('Medium');
      expect(capitalizeFirst('low')).toBe('Low');
      expect(capitalizeFirst('daily')).toBe('Daily');
    });
  });
});
