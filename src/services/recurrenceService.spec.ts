import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { recurrenceService } from './recurrenceService';
import type { DashItem } from '../models/DashItem';

describe('recurrenceService', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-18T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function createRecurringTask(overrides: Partial<DashItem> = {}): DashItem {
    return {
      id: 'original-task-id',
      title: 'Test Recurring Task',
      createdDate: '2026-01-18T12:00:00.000Z',
      links: [],
      photoPaths: [],
      itemType: 'task',
      isCompleted: false,
      dueDate: '2026-01-20T10:00:00.000Z',
      priority: 'medium',
      tags: ['work'],
      isRecurring: true,
      recurrenceRule: 'daily',
      hasReminder: true,
      reminderDate: '2026-01-20T09:00:00.000Z',
      ...overrides,
    };
  }

  describe('createRecurringTasks', () => {
    it('should return empty array if item is not recurring', () => {
      const nonRecurringTask = createRecurringTask({ isRecurring: false });

      const result = recurrenceService.createRecurringTasks(nonRecurringTask);

      expect(result).toEqual([]);
    });

    it('should return empty array if no recurrence rule', () => {
      const taskWithoutRule = createRecurringTask({ recurrenceRule: undefined });

      const result = recurrenceService.createRecurringTasks(taskWithoutRule);

      expect(result).toEqual([]);
    });

    it('should return empty array if no due date', () => {
      const taskWithoutDueDate = createRecurringTask({ dueDate: undefined });

      const result = recurrenceService.createRecurringTasks(taskWithoutDueDate);

      expect(result).toEqual([]);
    });

    it('should create 10 recurring tasks', () => {
      const task = createRecurringTask();

      const result = recurrenceService.createRecurringTasks(task);

      expect(result).toHaveLength(10);
    });

    it('should give each recurring task a unique ID', () => {
      const task = createRecurringTask();

      const result = recurrenceService.createRecurringTasks(task);

      const ids = result.map((t) => t.id);
      const uniqueIds = new Set(ids);

      expect(uniqueIds.size).toBe(10);
      expect(ids.every((id) => id !== task.id)).toBe(true);
    });

    it('should copy title and other properties from original', () => {
      const task = createRecurringTask({
        title: 'Daily Standup',
        priority: 'high',
        tags: ['work', 'meeting'],
      });

      const result = recurrenceService.createRecurringTasks(task);

      result.forEach((recurringTask) => {
        expect(recurringTask.title).toBe('Daily Standup');
        expect(recurringTask.priority).toBe('high');
        expect(recurringTask.tags).toEqual(['work', 'meeting']);
        expect(recurringTask.isRecurring).toBe(true);
        expect(recurringTask.recurrenceRule).toBe('daily');
      });
    });

    it('should set isCompleted to false for all recurring tasks', () => {
      const task = createRecurringTask({ isCompleted: true });

      const result = recurrenceService.createRecurringTasks(task);

      result.forEach((recurringTask) => {
        expect(recurringTask.isCompleted).toBe(false);
      });
    });

    it('should not copy reminder to recurring tasks', () => {
      const task = createRecurringTask({
        hasReminder: true,
        reminderDate: '2026-01-20T09:00:00.000Z',
      });

      const result = recurrenceService.createRecurringTasks(task);

      result.forEach((recurringTask) => {
        expect(recurringTask.hasReminder).toBe(false);
        expect(recurringTask.reminderDate).toBeUndefined();
      });
    });

    it('should set createdDate to current time for all recurring tasks', () => {
      const task = createRecurringTask();

      const result = recurrenceService.createRecurringTasks(task);

      result.forEach((recurringTask) => {
        expect(recurringTask.createdDate).toBe('2026-01-18T12:00:00.000Z');
      });
    });
  });

  describe('daily recurrence', () => {
    it('should create tasks with consecutive daily dates', () => {
      const task = createRecurringTask({
        dueDate: '2026-01-20T10:00:00.000Z',
        recurrenceRule: 'daily',
      });

      const result = recurrenceService.createRecurringTasks(task);

      const dates = result.map((t) => new Date(t.dueDate!));

      expect(dates[0].toISOString()).toBe('2026-01-21T10:00:00.000Z');
      expect(dates[1].toISOString()).toBe('2026-01-22T10:00:00.000Z');
      expect(dates[2].toISOString()).toBe('2026-01-23T10:00:00.000Z');
      expect(dates[9].toISOString()).toBe('2026-01-30T10:00:00.000Z');
    });

    it('should handle month boundary correctly', () => {
      const task = createRecurringTask({
        dueDate: '2026-01-30T10:00:00.000Z',
        recurrenceRule: 'daily',
      });

      const result = recurrenceService.createRecurringTasks(task);

      const dates = result.map((t) => new Date(t.dueDate!));

      expect(dates[0].toISOString()).toBe('2026-01-31T10:00:00.000Z');
      expect(dates[1].toISOString()).toBe('2026-02-01T10:00:00.000Z');
      expect(dates[2].toISOString()).toBe('2026-02-02T10:00:00.000Z');
    });
  });

  describe('weekly recurrence', () => {
    it('should create tasks with weekly intervals', () => {
      const task = createRecurringTask({
        dueDate: '2026-01-20T10:00:00.000Z',
        recurrenceRule: 'weekly',
      });

      const result = recurrenceService.createRecurringTasks(task);

      const dates = result.map((t) => new Date(t.dueDate!));

      expect(dates[0].toISOString()).toBe('2026-01-27T10:00:00.000Z');
      expect(dates[1].toISOString()).toBe('2026-02-03T10:00:00.000Z');
      expect(dates[2].toISOString()).toBe('2026-02-10T10:00:00.000Z');
    });

    it('should maintain same day of week', () => {
      // Jan 20, 2026 is a Tuesday
      const task = createRecurringTask({
        dueDate: '2026-01-20T10:00:00.000Z',
        recurrenceRule: 'weekly',
      });

      const result = recurrenceService.createRecurringTasks(task);

      result.forEach((recurringTask) => {
        const date = new Date(recurringTask.dueDate!);
        expect(date.getDay()).toBe(2); // Tuesday
      });
    });
  });

  describe('monthly recurrence', () => {
    it('should create tasks with monthly intervals', () => {
      const task = createRecurringTask({
        dueDate: '2026-01-15T10:00:00.000Z',
        recurrenceRule: 'monthly',
      });

      const result = recurrenceService.createRecurringTasks(task);

      const dates = result.map((t) => new Date(t.dueDate!));

      expect(dates[0].getMonth()).toBe(1); // February
      expect(dates[0].getDate()).toBe(15);
      expect(dates[1].getMonth()).toBe(2); // March
      expect(dates[1].getDate()).toBe(15);
      expect(dates[2].getMonth()).toBe(3); // April
      expect(dates[2].getDate()).toBe(15);
    });

    it('should handle year boundary correctly', () => {
      const task = createRecurringTask({
        dueDate: '2026-11-15T10:00:00.000Z',
        recurrenceRule: 'monthly',
      });

      const result = recurrenceService.createRecurringTasks(task);

      const dates = result.map((t) => new Date(t.dueDate!));

      expect(dates[0].getMonth()).toBe(11); // December 2026
      expect(dates[0].getFullYear()).toBe(2026);
      expect(dates[1].getMonth()).toBe(0); // January 2027
      expect(dates[1].getFullYear()).toBe(2027);
    });

    it('should handle months with fewer days (31st -> next month end)', () => {
      // Note: JavaScript Date handles this by rolling over
      const task = createRecurringTask({
        dueDate: '2026-01-31T10:00:00.000Z',
        recurrenceRule: 'monthly',
      });

      const result = recurrenceService.createRecurringTasks(task);

      const dates = result.map((t) => new Date(t.dueDate!));

      // February 2026 doesn't have 31 days, so it rolls over to March 3
      expect(dates[0].getMonth()).toBe(2); // March (rolled over from Feb 31)
    });

    it('should handle leap year February correctly', () => {
      // 2028 is a leap year
      vi.setSystemTime(new Date('2028-01-15T12:00:00.000Z'));

      const task = createRecurringTask({
        dueDate: '2028-01-29T10:00:00.000Z',
        recurrenceRule: 'monthly',
      });

      const result = recurrenceService.createRecurringTasks(task);

      const dates = result.map((t) => new Date(t.dueDate!));

      // February 2028 has 29 days (leap year)
      expect(dates[0].getMonth()).toBe(1); // February
      expect(dates[0].getDate()).toBe(29);
    });
  });
});
