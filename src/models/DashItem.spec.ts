import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getRelevantDate, isOverdue, createEmptyItem, type DashItem } from './DashItem';

describe('DashItem', () => {
  describe('getRelevantDate', () => {
    it('should return dueDate for tasks', () => {
      const task: DashItem = {
        id: '1',
        title: 'Test Task',
        createdDate: '2026-01-01T00:00:00.000Z',
        links: [],
        photoPaths: [],
        isCompleted: false,
        dueDate: '2026-01-15T10:00:00.000Z',
        priority: 'none',
        tags: [],
        isRecurring: false,
        hasReminder: false,
      };

      expect(getRelevantDate(task)).toBe('2026-01-15T10:00:00.000Z');
    });

    it('should return undefined for task without dueDate', () => {
      const task: DashItem = {
        id: '3',
        title: 'Task without due date',
        createdDate: '2026-01-01T00:00:00.000Z',
        links: [],
        photoPaths: [],
        isCompleted: false,
        priority: 'none',
        tags: [],
        isRecurring: false,
        hasReminder: false,
      };

      expect(getRelevantDate(task)).toBeUndefined();
    });
  });

  describe('isOverdue', () => {
    beforeEach(() => {
      // Mock the current date to 2026-01-18
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-01-18T12:00:00.000Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should return true for incomplete task with past dueDate', () => {
      const task: DashItem = {
        id: '1',
        title: 'Overdue Task',
        createdDate: '2026-01-01T00:00:00.000Z',
        links: [],
        photoPaths: [],
        isCompleted: false,
        dueDate: '2026-01-15T10:00:00.000Z', // Past date
        priority: 'none',
        tags: [],
        isRecurring: false,
        hasReminder: false,
      };

      expect(isOverdue(task)).toBe(true);
    });

    it('should return false for incomplete task with future dueDate', () => {
      const task: DashItem = {
        id: '2',
        title: 'Future Task',
        createdDate: '2026-01-01T00:00:00.000Z',
        links: [],
        photoPaths: [],
        isCompleted: false,
        dueDate: '2026-01-25T10:00:00.000Z', // Future date
        priority: 'none',
        tags: [],
        isRecurring: false,
        hasReminder: false,
      };

      expect(isOverdue(task)).toBe(false);
    });

    it('should return false for completed task even with past dueDate', () => {
      const task: DashItem = {
        id: '3',
        title: 'Completed Task',
        createdDate: '2026-01-01T00:00:00.000Z',
        links: [],
        photoPaths: [],
        isCompleted: true,
        dueDate: '2026-01-15T10:00:00.000Z', // Past date
        priority: 'none',
        tags: [],
        isRecurring: false,
        hasReminder: false,
      };

      expect(isOverdue(task)).toBe(false);
    });

    it('should return false for task without dueDate', () => {
      const task: DashItem = {
        id: '4',
        title: 'Task without due date',
        createdDate: '2026-01-01T00:00:00.000Z',
        links: [],
        photoPaths: [],
        isCompleted: false,
        priority: 'none',
        tags: [],
        isRecurring: false,
        hasReminder: false,
      };

      expect(isOverdue(task)).toBe(false);
    });
  });

  describe('createEmptyItem', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-01-18T12:00:00.000Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should create an empty task by default', () => {
      const item = createEmptyItem();

      expect(item.id).toBe('');
      expect(item.title).toBe('');
      expect(item.notes).toBe('');
      expect(item.isCompleted).toBe(false);
      expect(item.priority).toBe('none');
      expect(item.tags).toEqual([]);
      expect(item.links).toEqual([]);
      expect(item.photoPaths).toEqual([]);
      expect(item.isRecurring).toBe(false);
      expect(item.hasReminder).toBe(false);
      expect(item.location).toBe('');
    });

    it('should have a valid createdDate timestamp', () => {
      const item = createEmptyItem();
      const createdDate = new Date(item.createdDate);

      expect(createdDate.getTime()).toBe(new Date('2026-01-18T12:00:00.000Z').getTime());
    });

    it('should create independent instances', () => {
      const item1 = createEmptyItem();
      const item2 = createEmptyItem();

      item1.title = 'Modified';
      item1.tags.push('test');

      expect(item2.title).toBe('');
      expect(item2.tags).toEqual([]);
    });
  });
});
