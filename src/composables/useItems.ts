import { ref, computed } from 'vue';
import { v4 as uuidv4 } from 'uuid';
import type { DashItem } from '../models/DashItem';
import { databaseService, setOnSeedComplete } from '../services/database';
import { notificationService } from '../services/notificationService';
import { recurrenceService } from '../services/recurrenceService';
import { photoService } from '../services/photoService';

const items = ref<DashItem[]>([]);
const searchText = ref('');
const showCompleted = ref(false);
const isLoading = ref(false);
const isInitialized = ref(false);

const SHOW_COMPLETED_KEY = 'show_completed';

export function useItems() {
  const filteredItems = computed(() => {
    let result = [...items.value];

    // Filter out completed tasks unless showCompleted is true
    if (!showCompleted.value) {
      result = result.filter((item) => !item.isCompleted);
    }

    // Apply search filter
    if (searchText.value.trim()) {
      const search = searchText.value.toLowerCase();
      result = result.filter((item) => {
        return (
          item.title.toLowerCase().includes(search) ||
          item.notes?.toLowerCase().includes(search) ||
          item.location?.toLowerCase().includes(search) ||
          item.tags.some((tag) => tag.toLowerCase().includes(search))
        );
      });
    }

    // Sort items: incomplete tasks first, then completed tasks
    result.sort((a, b) => {
      // Incomplete tasks first, completed tasks last
      if (a.isCompleted !== b.isCompleted) {
        return a.isCompleted ? 1 : -1;
      }

      // Within same category, sort by due date ascending
      const dateA = a.dueDate;
      const dateB = b.dueDate;

      if (!dateA && !dateB) return 0;
      if (!dateA) return 1;
      if (!dateB) return -1;

      return new Date(dateA).getTime() - new Date(dateB).getTime();
    });

    return result;
  });

  async function initialize(): Promise<void> {
    if (isInitialized.value) return;

    isLoading.value = true;
    try {
      await databaseService.initialize();
      await photoService.initialize();
      await loadItems();

      // Register callback to refresh UI after seeding demo data
      setOnSeedComplete(loadItems);

      // Load showCompleted preference
      const showCompletedPref = await databaseService.getPreference(SHOW_COMPLETED_KEY);
      showCompleted.value = showCompletedPref === 'true';

      isInitialized.value = true;
    } catch (error) {
      console.error('Error initializing:', error);
      throw error;
    } finally {
      isLoading.value = false;
    }
  }

  async function loadItems(): Promise<void> {
    items.value = await databaseService.getAllItems();
  }

  async function createItem(item: Omit<DashItem, 'id' | 'createdDate'>): Promise<DashItem> {
    const newItem: DashItem = {
      ...item,
      id: uuidv4(),
      createdDate: new Date().toISOString(),
    };

    await databaseService.createItem(newItem);
    items.value.push(newItem);

    // Schedule reminder if set
    if (newItem.hasReminder && newItem.reminderDate) {
      await notificationService.scheduleReminder(newItem);
    }

    // Create recurring tasks if applicable
    if (newItem.isRecurring && newItem.recurrenceRule && newItem.dueDate) {
      const recurringTasks = recurrenceService.createRecurringTasks(newItem);
      for (const task of recurringTasks) {
        await databaseService.createItem(task);
        items.value.push(task);
      }
    }

    return newItem;
  }

  async function updateItem(item: DashItem): Promise<void> {
    await databaseService.updateItem(item);

    const index = items.value.findIndex((i) => i.id === item.id);
    if (index !== -1) {
      items.value[index] = item;
    }

    // Update reminder
    await notificationService.updateReminder(item);
  }

  async function deleteItem(id: string): Promise<void> {
    const item = items.value.find((i) => i.id === id);
    if (!item) return;

    // Cancel reminder if one is set
    if (item.hasReminder) {
      await notificationService.cancelReminder(id);
    }

    // Delete associated photos
    if (item.photoPaths.length > 0) {
      await photoService.deletePhotos(item.photoPaths);
    }

    // Delete comment images
    if (item.comments && item.comments.length > 0) {
      const commentImagePaths = item.comments
        .filter((c) => c.imagePath)
        .map((c) => c.imagePath as string);
      if (commentImagePaths.length > 0) {
        await photoService.deletePhotos(commentImagePaths);
      }
    }

    await databaseService.deleteItem(id);
    items.value = items.value.filter((i) => i.id !== id);
  }

  async function toggleComplete(id: string): Promise<void> {
    const item = items.value.find((i) => i.id === id);
    if (!item) return;

    const updatedItem: DashItem = {
      ...item,
      isCompleted: !item.isCompleted,
    };

    await updateItem(updatedItem);

    // Cancel reminder if completing
    if (updatedItem.isCompleted) {
      await notificationService.cancelReminder(id);
    }
  }

  function setSearchText(text: string): void {
    searchText.value = text;
  }

  async function toggleShowCompleted(): Promise<void> {
    showCompleted.value = !showCompleted.value;
    await databaseService.setPreference(SHOW_COMPLETED_KEY, showCompleted.value ? 'true' : 'false');
  }

  return {
    // State
    items,
    filteredItems,
    searchText,
    showCompleted,
    isLoading,
    isInitialized,

    // Actions
    initialize,
    loadItems,
    createItem,
    updateItem,
    deleteItem,
    toggleComplete,
    setSearchText,
    toggleShowCompleted,
  };
}
