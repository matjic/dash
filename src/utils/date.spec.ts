import { describe, it, expect } from 'vitest';
import {
  formatDate,
  formatRelativeDate,
  formatCommentDate,
  formatDateNice,
  formatDateShort,
} from './date';

describe('date utils', () => {
  const testDate = '2025-06-15T14:30:00.000Z';

  describe('formatDate', () => {
    it('should return a string containing month, day, and year', () => {
      const result = formatDate(testDate);
      expect(result).toContain('Jun');
      expect(result).toContain('15');
      expect(result).toContain('2025');
    });

    it('should handle different date strings', () => {
      const result = formatDate('2024-03-15T12:00:00.000Z');
      expect(result).toContain('Mar');
      expect(result).toContain('15');
      expect(result).toContain('2024');
    });
  });

  describe('formatRelativeDate', () => {
    it('should return a formatted date string', () => {
      const result = formatRelativeDate(testDate);
      expect(result).toContain('Jun');
      expect(result).toContain('15');
    });

    it('should include year for dates in different years', () => {
      const oldDate = '2020-03-10T10:00:00.000Z';
      const result = formatRelativeDate(oldDate);
      expect(result).toContain('2020');
    });
  });

  describe('formatCommentDate', () => {
    it('should return month and day', () => {
      const result = formatCommentDate(testDate);
      expect(result).toContain('Jun');
      expect(result).toContain('15');
    });
  });

  describe('formatDateNice', () => {
    it('should include weekday', () => {
      const result = formatDateNice(testDate);
      // June 15, 2025 is a Sunday
      expect(result).toContain('Sun');
      expect(result).toContain('Jun');
      expect(result).toContain('15');
    });

    it('should include year for dates in different years', () => {
      const oldDate = '2020-03-10T10:00:00.000Z';
      const result = formatDateNice(oldDate);
      expect(result).toContain('2020');
    });
  });

  describe('formatDateShort', () => {
    it('should return short date with month, day, year', () => {
      const result = formatDateShort(testDate);
      expect(result).toContain('Jun');
      expect(result).toContain('2025');
    });
  });
});
