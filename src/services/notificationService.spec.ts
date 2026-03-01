import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockLocalNotifications } from '../test/mocks/capacitor';

// Mock the Capacitor LocalNotifications module
vi.mock('@capacitor/local-notifications', () => ({
  LocalNotifications: mockLocalNotifications,
}));

// Import after mocking
import { notificationService } from './notificationService';
import type { DashItem } from '../models/DashItem';

// Helper to get scheduled notification from mock
function getScheduledNotification():
  | {
      id: number;
      title: string;
      body: string;
      extra: { itemId: string };
    }
  | undefined {
  const calls = mockLocalNotifications.schedule.mock.calls as unknown[][];
  if (calls.length === 0) return undefined;
  const lastCall = calls[calls.length - 1] as [{ notifications: unknown[] }] | undefined;
  const notifications = lastCall?.[0]?.notifications;
  return notifications?.[0] as ReturnType<typeof getScheduledNotification>;
}

// Helper to get cancel call arg from mock
function getCancelArg(): { notifications: { id: number }[] } | undefined {
  const calls = mockLocalNotifications.cancel.mock.calls as unknown[][];
  if (calls.length === 0) return undefined;
  const lastCall = calls[calls.length - 1] as [{ notifications: { id: number }[] }] | undefined;
  return lastCall?.[0];
}

describe('notificationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getNotificationId (via scheduleReminder)', () => {
    it('should generate consistent IDs for the same UUID', async () => {
      const item1: DashItem = {
        id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        title: 'Test Task',
        notes: '',
        createdDate: new Date().toISOString(),
        links: [],
        photoPaths: [],
        comments: [],
        isCompleted: false,
        priority: 'none',
        tags: [],
        isRecurring: false,
        hasReminder: true,
        reminderDate: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
      };

      await notificationService.scheduleReminder(item1);
      const firstCallId = getScheduledNotification()?.id;

      vi.clearAllMocks();

      await notificationService.scheduleReminder(item1);
      const secondCallId = getScheduledNotification()?.id;

      expect(firstCallId).toBe(secondCallId);
    });

    it('should generate different IDs for different UUIDs', async () => {
      const item1: DashItem = {
        id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        title: 'Test Task 1',
        notes: '',
        createdDate: new Date().toISOString(),
        links: [],
        photoPaths: [],
        comments: [],
        isCompleted: false,
        priority: 'none',
        tags: [],
        isRecurring: false,
        hasReminder: true,
        reminderDate: new Date(Date.now() + 3600000).toISOString(),
      };

      const item2: DashItem = {
        ...item1,
        id: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
        title: 'Test Task 2',
      };

      await notificationService.scheduleReminder(item1);
      const id1 = getScheduledNotification()?.id;

      vi.clearAllMocks();

      await notificationService.scheduleReminder(item2);
      const id2 = getScheduledNotification()?.id;

      expect(id1).not.toBe(id2);
    });
  });

  describe('formatNotificationBody', () => {
    it('should format task notification with due date', async () => {
      const dueDate = new Date(Date.now() + 86400000); // Tomorrow
      const item: DashItem = {
        id: 'test-id-123',
        title: 'Test Task',
        notes: 'Some notes',
        createdDate: new Date().toISOString(),
        links: [],
        photoPaths: [],
        comments: [],
        isCompleted: false,
        dueDate: dueDate.toISOString(),
        priority: 'none',
        tags: [],
        isRecurring: false,
        hasReminder: true,
        reminderDate: new Date(Date.now() + 3600000).toISOString(),
      };

      await notificationService.scheduleReminder(item);

      const body = getScheduledNotification()?.body;
      expect(body).toContain('Due');
    });

    it('should use fallback message when no date is set', async () => {
      const item: DashItem = {
        id: 'test-id-no-date',
        title: 'Test Task',
        notes: '',
        createdDate: new Date().toISOString(),
        links: [],
        photoPaths: [],
        comments: [],
        isCompleted: false,
        priority: 'none',
        tags: [],
        isRecurring: false,
        hasReminder: true,
        reminderDate: new Date(Date.now() + 3600000).toISOString(),
      };

      await notificationService.scheduleReminder(item);

      const body = getScheduledNotification()?.body;
      expect(body).toBe('Task reminder');
    });
  });

  describe('extra data for tap handling', () => {
    it('should include itemId in extra data', async () => {
      const item: DashItem = {
        id: 'test-item-id-extra',
        title: 'Test Task',
        notes: '',
        createdDate: new Date().toISOString(),
        links: [],
        photoPaths: [],
        comments: [],
        isCompleted: false,
        priority: 'none',
        tags: [],
        isRecurring: false,
        hasReminder: true,
        reminderDate: new Date(Date.now() + 3600000).toISOString(),
      };

      await notificationService.scheduleReminder(item);

      const extra = getScheduledNotification()?.extra;
      expect(extra).toBeDefined();
      expect(extra?.itemId).toBe('test-item-id-extra');
    });
  });

  describe('scheduleReminder', () => {
    it('should not schedule if hasReminder is false', async () => {
      const item: DashItem = {
        id: 'test-no-reminder',
        title: 'Test Task',
        notes: '',
        createdDate: new Date().toISOString(),
        links: [],
        photoPaths: [],
        comments: [],
        isCompleted: false,
        priority: 'none',
        tags: [],
        isRecurring: false,
        hasReminder: false,
        reminderDate: new Date(Date.now() + 3600000).toISOString(),
      };

      await notificationService.scheduleReminder(item);

      expect(mockLocalNotifications.schedule).not.toHaveBeenCalled();
    });

    it('should not schedule if reminderDate is in the past', async () => {
      const item: DashItem = {
        id: 'test-past-reminder',
        title: 'Test Task',
        notes: '',
        createdDate: new Date().toISOString(),
        links: [],
        photoPaths: [],
        comments: [],
        isCompleted: false,
        priority: 'none',
        tags: [],
        isRecurring: false,
        hasReminder: true,
        reminderDate: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      };

      await notificationService.scheduleReminder(item);

      expect(mockLocalNotifications.schedule).not.toHaveBeenCalled();
    });

    it('should not schedule if reminderDate is missing', async () => {
      const item: DashItem = {
        id: 'test-missing-date',
        title: 'Test Task',
        notes: '',
        createdDate: new Date().toISOString(),
        links: [],
        photoPaths: [],
        comments: [],
        isCompleted: false,
        priority: 'none',
        tags: [],
        isRecurring: false,
        hasReminder: true,
        reminderDate: undefined,
      };

      await notificationService.scheduleReminder(item);

      expect(mockLocalNotifications.schedule).not.toHaveBeenCalled();
    });
  });

  describe('cancelReminder', () => {
    it('should cancel notification with correct ID', async () => {
      await notificationService.cancelReminder('test-cancel-id');

      expect(mockLocalNotifications.cancel).toHaveBeenCalled();
      const cancelArg = getCancelArg();
      expect(cancelArg?.notifications).toHaveLength(1);
    });
  });

  describe('updateReminder', () => {
    it('should cancel and reschedule reminder', async () => {
      const item: DashItem = {
        id: 'test-update-id',
        title: 'Test Task',
        notes: '',
        createdDate: new Date().toISOString(),
        links: [],
        photoPaths: [],
        comments: [],
        isCompleted: false,
        priority: 'none',
        tags: [],
        isRecurring: false,
        hasReminder: true,
        reminderDate: new Date(Date.now() + 3600000).toISOString(),
      };

      await notificationService.updateReminder(item);

      expect(mockLocalNotifications.cancel).toHaveBeenCalled();
      expect(mockLocalNotifications.schedule).toHaveBeenCalled();
    });

    it('should only cancel if reminder is disabled', async () => {
      const item: DashItem = {
        id: 'test-update-disabled',
        title: 'Test Task',
        notes: '',
        createdDate: new Date().toISOString(),
        links: [],
        photoPaths: [],
        comments: [],
        isCompleted: false,
        priority: 'none',
        tags: [],
        isRecurring: false,
        hasReminder: false,
      };

      await notificationService.updateReminder(item);

      expect(mockLocalNotifications.cancel).toHaveBeenCalled();
      expect(mockLocalNotifications.schedule).not.toHaveBeenCalled();
    });
  });
});
