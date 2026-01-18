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
            body: item.notes || 'Reminder',
            schedule: {
              at: reminderDate,
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

  private getNotificationId(itemId: string): number {
    // Convert UUID to a consistent integer ID
    // Take the first 8 characters of the UUID and convert to a number
    const hash = itemId.substring(0, 8);
    return parseInt(hash.replace(/[^0-9]/g, '').substring(0, 9)) || 1;
  }
}

export const notificationService = new NotificationService();
