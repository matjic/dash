import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { parseQuickInput } from './nlpParser';

describe('nlpParser', () => {
  beforeEach(() => {
    // Mock the current date to 2026-01-18 at noon
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-18T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('priority parsing', () => {
    it('should parse "high priority" as high', () => {
      const result = parseQuickInput('Buy groceries high priority');

      expect(result.priority).toBe('high');
      expect(result.title).toBe('Buy groceries');
    });

    it('should parse "urgent" as high priority', () => {
      const result = parseQuickInput('Fix the bug urgent');

      expect(result.priority).toBe('high');
      expect(result.title).toBe('Fix the bug');
    });

    it('should parse "asap" as high priority', () => {
      const result = parseQuickInput('Call mom asap');

      expect(result.priority).toBe('high');
      expect(result.title).toBe('Call mom');
    });

    it('should parse "important" as high priority', () => {
      const result = parseQuickInput('important meeting prep');

      expect(result.priority).toBe('high');
      expect(result.title).toBe('meeting prep');
    });

    it('should parse "medium priority" as medium', () => {
      const result = parseQuickInput('Review document medium priority');

      expect(result.priority).toBe('medium');
      expect(result.title).toBe('Review document');
    });

    it('should parse "normal priority" as medium', () => {
      const result = parseQuickInput('normal priority task');

      expect(result.priority).toBe('medium');
      expect(result.title).toBe('task');
    });

    it('should parse "low priority" as low', () => {
      const result = parseQuickInput('Clean desk low priority');

      expect(result.priority).toBe('low');
      expect(result.title).toBe('Clean desk');
    });

    it('should parse "low" as low priority', () => {
      const result = parseQuickInput('Organize files low');

      expect(result.priority).toBe('low');
      expect(result.title).toBe('Organize files');
    });

    it('should default to "none" when no priority specified', () => {
      const result = parseQuickInput('Simple task');

      expect(result.priority).toBe('none');
      expect(result.title).toBe('Simple task');
    });

    it('should be case insensitive for priority', () => {
      const result = parseQuickInput('Task HIGH PRIORITY');

      expect(result.priority).toBe('high');
      expect(result.title).toBe('Task');
    });
  });

  describe('recurrence parsing', () => {
    it('should parse "daily" as recurring', () => {
      const result = parseQuickInput('Take vitamins daily');

      expect(result.isRecurring).toBe(true);
      expect(result.recurrenceRule).toBe('daily');
      expect(result.title).toBe('Take vitamins');
    });

    it('should parse "every day" as daily recurring', () => {
      const result = parseQuickInput('Exercise every day');

      expect(result.isRecurring).toBe(true);
      expect(result.recurrenceRule).toBe('daily');
      expect(result.title).toBe('Exercise');
    });

    it('should parse "weekly" as recurring', () => {
      const result = parseQuickInput('Team meeting weekly');

      expect(result.isRecurring).toBe(true);
      expect(result.recurrenceRule).toBe('weekly');
      expect(result.title).toBe('Team meeting');
    });

    it('should parse "every week" as weekly recurring', () => {
      const result = parseQuickInput('Call parents every week');

      expect(result.isRecurring).toBe(true);
      expect(result.recurrenceRule).toBe('weekly');
      expect(result.title).toBe('Call parents');
    });

    it('should parse "monthly" as recurring', () => {
      const result = parseQuickInput('Pay rent monthly');

      expect(result.isRecurring).toBe(true);
      expect(result.recurrenceRule).toBe('monthly');
      expect(result.title).toBe('Pay rent');
    });

    it('should parse "every month" as monthly recurring', () => {
      const result = parseQuickInput('Review budget every month');

      expect(result.isRecurring).toBe(true);
      expect(result.recurrenceRule).toBe('monthly');
      expect(result.title).toBe('Review budget');
    });

    it('should default to non-recurring', () => {
      const result = parseQuickInput('One-time task');

      expect(result.isRecurring).toBe(false);
      expect(result.recurrenceRule).toBeUndefined();
    });
  });

  describe('date parsing', () => {
    it('should parse "tomorrow"', () => {
      const result = parseQuickInput('Buy groceries tomorrow');

      expect(result.dueDate).toBeDefined();
      // Check that the date is in the future (tomorrow from our mocked date)
      const resultDate = new Date(result.dueDate!);
      expect(resultDate.getDate()).toBe(19); // Tomorrow is Jan 19
      expect(result.title).toBe('Buy groceries');
    });

    it('should parse "today"', () => {
      const result = parseQuickInput('Finish report today');

      expect(result.dueDate).toBeDefined();
      // Check that the date is today (mocked to Jan 18)
      const resultDate = new Date(result.dueDate!);
      expect(resultDate.getDate()).toBe(18); // Today is Jan 18
      expect(result.title).toBe('Finish report');
    });

    it('should parse specific dates like "Jan 25"', () => {
      const result = parseQuickInput('Doctor appointment Jan 25');

      expect(result.dueDate).toBeDefined();
      expect(result.dueDate?.getMonth()).toBe(0); // January
      expect(result.dueDate?.getDate()).toBe(25);
      expect(result.title).toBe('Doctor appointment');
    });

    it('should parse "next Friday"', () => {
      const result = parseQuickInput('Submit proposal next Friday');

      expect(result.dueDate).toBeDefined();
      expect(result.dueDate?.getDay()).toBe(5); // Friday
      expect(result.title).toBe('Submit proposal');
    });

    it('should parse "in 3 days"', () => {
      const result = parseQuickInput('Follow up in 3 days');

      expect(result.dueDate).toBeDefined();
      // Check that the date is 3 days from now
      const resultDate = new Date(result.dueDate!);
      expect(resultDate.getDate()).toBe(21); // 3 days from Jan 18 is Jan 21
      expect(result.title).toBe('Follow up');
    });

    it('should handle input without dates', () => {
      const result = parseQuickInput('Simple task with no date');

      expect(result.dueDate).toBeUndefined();
      expect(result.title).toBe('Simple task with no date');
    });
  });

  describe('combined parsing', () => {
    it('should parse date, priority, and recurrence together', () => {
      const result = parseQuickInput('Team standup tomorrow high priority daily');

      expect(result.title).toBe('Team standup');
      expect(result.dueDate).toBeDefined();
      // Check tomorrow's date
      const resultDate = new Date(result.dueDate!);
      expect(resultDate.getDate()).toBe(19);
      expect(result.priority).toBe('high');
      expect(result.isRecurring).toBe(true);
      expect(result.recurrenceRule).toBe('daily');
    });

    it('should handle priority before date', () => {
      const result = parseQuickInput('urgent Buy milk tomorrow');

      expect(result.title).toBe('Buy milk');
      expect(result.priority).toBe('high');
      expect(result.dueDate).toBeDefined();
    });

    it('should handle recurrence with date', () => {
      const result = parseQuickInput('Gym workout every week starting Monday');

      expect(result.isRecurring).toBe(true);
      expect(result.recurrenceRule).toBe('weekly');
      expect(result.dueDate).toBeDefined();
    });

    it('should clean up extra whitespace', () => {
      const result = parseQuickInput('  Buy   groceries   tomorrow  ');

      expect(result.title).toBe('Buy groceries');
    });
  });

  describe('edge cases', () => {
    it('should handle empty input', () => {
      const result = parseQuickInput('');

      expect(result.title).toBe('');
      expect(result.priority).toBe('none');
      expect(result.isRecurring).toBe(false);
      expect(result.dueDate).toBeUndefined();
    });

    it('should handle whitespace-only input', () => {
      const result = parseQuickInput('   ');

      expect(result.title).toBe('');
    });

    it('should preserve words that contain priority keywords', () => {
      // "important" is a keyword but should not match within other words
      const result = parseQuickInput('Buy new imports');

      // This depends on regex implementation - testing actual behavior
      expect(result.title).toContain('imports');
    });

    it('should handle multiple dates (use first one)', () => {
      const result = parseQuickInput('Meeting tomorrow then lunch Friday');

      expect(result.dueDate).toBeDefined();
      // chrono-node typically picks up the first date (tomorrow)
      const resultDate = new Date(result.dueDate!);
      expect(resultDate.getDate()).toBe(19);
    });
  });
});
