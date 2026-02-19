import { AppShortcuts } from '@capawesome/capacitor-app-shortcuts';
import { Capacitor } from '@capacitor/core';
import type { Router } from 'vue-router';
import { processPendingShares, setPendingSharedData } from './shareService';

export type ShortcutId = 'add-task' | 'show-today';

interface ShortcutConfig {
  id: ShortcutId;
  title: string;
  description: string;
  iosIcon: string;
}

const shortcuts: ShortcutConfig[] = [
  {
    id: 'add-task',
    title: 'Add Task',
    description: 'Create a new task',
    iosIcon: 'plus.circle.fill',
  },
  {
    id: 'show-today',
    title: 'Today',
    description: "View today's timeline",
    iosIcon: 'calendar',
  },
];

/**
 * Initialize Home Screen Quick Actions (3D Touch / long-press shortcuts)
 */
export async function initializeShortcuts(): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    return;
  }

  try {
    await AppShortcuts.set({
      shortcuts: shortcuts.map((s) => ({
        id: s.id,
        title: s.title,
        description: s.description,
        icon: s.iosIcon,
      })),
    });
  } catch (error) {
    console.error('Failed to set app shortcuts:', error);
  }
}

/**
 * Set up listener for shortcut clicks and handle navigation
 */
export function setupShortcutListener(router: Router): void {
  if (!Capacitor.isNativePlatform()) {
    return;
  }

  AppShortcuts.addListener('click', async (event) => {
    const shortcutId = event.shortcutId as ShortcutId;
    
    switch (shortcutId) {
      case 'add-task':
        await router.push({ name: 'ItemDetail', params: { id: 'new' }, query: { type: 'task' } });
        break;
      case 'show-today':
        await router.push({ name: 'Timeline', query: { filter: 'today' } });
        break;
      default:
        console.warn('Unknown shortcut:', shortcutId);
    }
  });
}

/**
 * Handle deep link URLs from Siri intents
 * URL format: dash://action?param=value
 */
export async function handleDeepLink(url: string, router: Router): Promise<boolean> {
  try {
    const parsed = new URL(url);
    
    if (parsed.protocol !== 'dash:') {
      return false;
    }

    const action = parsed.hostname;
    const params = Object.fromEntries(parsed.searchParams);

    switch (action) {
      case 'add-task':
        await router.push({ 
          name: 'ItemDetail', 
          params: { id: 'new' }, 
          query: { type: 'task', title: params.title } 
        });
        return true;
      
      case 'timeline':
        await router.push({ name: 'Timeline', query: { filter: params.filter } });
        return true;

      case 'share':
        // Handle incoming shared content from Share Extension
        await handleShareDeepLink(router);
        return true;

      default:
        console.warn('Unknown deep link action:', action);
        return false;
    }
  } catch (error) {
    console.error('Failed to handle deep link:', error);
    return false;
  }
}

/**
 * Handle the dash://share deep link from the Share Extension
 */
async function handleShareDeepLink(router: Router): Promise<void> {
  try {
    // Process shared content from the Share Extension
    const sharedData = await processPendingShares();
    
    if (sharedData) {
      // Store the shared data for ItemDetail to consume
      setPendingSharedData(sharedData);
      
      // Navigate to new item with shared flag
      await router.push({
        name: 'ItemDetail',
        params: { id: 'new' },
        query: { shared: 'true' },
      });
    } else {
      console.log('No shared data found, navigating to new item anyway');
      // Still navigate to new item even if no data was found
      await router.push({
        name: 'ItemDetail',
        params: { id: 'new' },
      });
    }
  } catch (error) {
    console.error('Error handling share deep link:', error);
  }
}
