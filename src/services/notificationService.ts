import { LocalNotifications } from '@capacitor/local-notifications';
import type { DashItem } from '../models/DashItem';

class NotificationService {
  private permissionRequested = false;

  async requestPermission(): Promise<boolean> {
    if (this.permissionRequested) return true;

    try {
      const result = await LocalNotifications.requestPermissions();
      this.permissionRequested = result.display === 'granted';
      return this.permissionRequested;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  async scheduleReminder(item: DashItem): Promise<void> {
    if (!item.hasReminder || !item.reminderDate) return;

    const reminderDate = new Date(item.reminderDate);
    const now = new Date();

    // Only schedule future reminders
    if (reminderDate <= now) {
      console.warn('Reminder date is in the past, not scheduling');
      return;
    }

    // Request permission if not already granted
    const hasPermission = await this.requestPermission();
    if (!hasPermission) {
      console.warn('Notification permission not granted');
      return;
    }

    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            id: this.getNotificationId(item.id),
            title: item.title,
            body: this.formatNotificationBody(item),
            schedule: {
              at: reminderDate,
            },
            extra: {
              itemId: item.id,
              itemType: item.itemType,
            },
          },
        ],
      });
    } catch (error) {
      console.error('Error scheduling reminder:', error);
      throw error;
    }
  }

  async cancelReminder(itemId: string): Promise<void> {
    try {
      const notificationId = this.getNotificationId(itemId);
      await LocalNotifications.cancel({
        notifications: [{ id: notificationId }],
      });
    } catch (error) {
      console.error('Error canceling reminder:', error);
      throw error;
    }
  }

  async updateReminder(item: DashItem): Promise<void> {
    await this.cancelReminder(item.id);
    if (item.hasReminder && item.reminderDate) {
      await this.scheduleReminder(item);
    }
  }

  /**
   * Format notification body with relevant date/time info
   */
  private formatNotificationBody(item: DashItem): string {
    const isEvent = item.itemType === 'event';
    const relevantDate = isEvent ? item.eventDate : item.dueDate;

    if (relevantDate) {
      const formatted = new Date(relevantDate).toLocaleString([], {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });

      if (isEvent) {
        return `Event starts ${formatted}`;
      } else {
        return `Due ${formatted}`;
      }
    }

    // Fallback to notes or generic message
    return item.notes || (isEvent ? 'Event reminder' : 'Task reminder');
  }

  /**
   * Generate a stable notification ID from item UUID using a proper hash function
   * This prevents collisions that could occur with the previous implementation
   */
  private getNotificationId(itemId: string): number {
    let hash = 0;
    for (let i = 0; i < itemId.length; i++) {
      const char = itemId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    // Ensure positive number and within safe range for notification IDs
    return Math.abs(hash) % 2147483647;
  }
}

export const notificationService = new NotificationService();
