import { LocalNotifications } from '@capacitor/local-notifications';
import type { Router } from 'vue-router';

/**
 * Setup notification listeners for handling user interactions with notifications.
 * This enables tap-to-open functionality - when a user taps a notification,
 * they are navigated to the relevant item detail page.
 */
export async function setupNotificationListeners(router: Router): Promise<void> {
  try {
    // Listen for notification action (when user taps on a notification)
    await LocalNotifications.addListener('localNotificationActionPerformed', (event) => {
      const itemId = event.notification.extra?.itemId as string | undefined;

      if (itemId) {
        // Navigate to the item detail page
        router.push(`/item/${itemId}`);
      }
    });

    // Listen for notifications received while app is in foreground
    await LocalNotifications.addListener('localNotificationReceived', (notification) => {
      // Log for debugging - notification was received while app was open
      console.log('Notification received in foreground:', notification.title);
    });
  } catch (error) {
    console.error('Error setting up notification listeners:', error);
  }
}

/**
 * Remove all notification listeners.
 * Call this when the app is being destroyed if needed.
 */
export async function removeNotificationListeners(): Promise<void> {
  try {
    await LocalNotifications.removeAllListeners();
  } catch (error) {
    console.error('Error removing notification listeners:', error);
  }
}
