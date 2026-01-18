import { ref, computed } from 'vue';
import { v4 as uuidv4 } from 'uuid';
import type { DashItem } from '../models/DashItem';
import { getRelevantDate } from '../models/DashItem';
import { databaseService } from '../services/database';
import { notificationService } from '../services/notificationService';
import { recurrenceService } from '../services/recurrenceService';
import { photoService } from '../services/photoService';

export type FilterType = 'all' | 'tasks' | 'events';

const items = ref<DashItem[]>([]);
const searchText = ref('');
const selectedFilter = ref<FilterType>('all');
const isLoading = ref(false);
const isInitialized = ref(false);

export function useItems() {
  const filteredItems = computed(() => {
    let result = [...items.value];

    // Apply type filter
    if (selectedFilter.value === 'tasks') {
      result = result.filter((item) => item.itemType === 'task');
    } else if (selectedFilter.value === 'events') {
      result = result.filter((item) => item.itemType === 'event');
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

    // Sort items per spec 7.1
    result.sort((a, b) => {
      // 1. Incomplete tasks first
      // 2. Events
      // 3. Completed tasks
      const getCategory = (item: DashItem): number => {
        if (item.itemType === 'task' && !item.isCompleted) return 0;
        if (item.itemType === 'event') return 1;
        return 2; // Completed tasks
      };

      const categoryA = getCategory(a);
      const categoryB = getCategory(b);

      if (categoryA !== categoryB) {
        return categoryA - categoryB;
      }

      // Within same category, sort by relevant date ascending
      const dateA = getRelevantDate(a);
      const dateB = getRelevantDate(b);

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

    // Cancel reminder
    await notificationService.cancelReminder(id);

    // Delete associated photos
    if (item.photoPaths.length > 0) {
      await photoService.deletePhotos(item.photoPaths);
    }

    await databaseService.deleteItem(id);
    items.value = items.value.filter((i) => i.id !== id);
  }

  async function toggleComplete(id: string): Promise<void> {
    const item = items.value.find((i) => i.id === id);
    if (!item || item.itemType !== 'task') return;

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

  async function convertToEvent(id: string): Promise<void> {
    const item = items.value.find((i) => i.id === id);
    if (!item || item.itemType !== 'task') return;

    const updatedItem: DashItem = {
      ...item,
      itemType: 'event',
      eventDate: item.dueDate || new Date().toISOString(),
      dueDate: undefined,
      isCompleted: false,
    };

    await updateItem(updatedItem);
  }

  async function convertToTask(id: string): Promise<void> {
    const item = items.value.find((i) => i.id === id);
    if (!item || item.itemType !== 'event') return;

    const updatedItem: DashItem = {
      ...item,
      itemType: 'task',
      dueDate: item.eventDate,
      eventDate: undefined,
      endDate: undefined,
      isCompleted: false,
    };

    await updateItem(updatedItem);
  }

  function setSearchText(text: string): void {
    searchText.value = text;
  }

  function setFilter(filter: FilterType): void {
    selectedFilter.value = filter;
  }

  return {
    // State
    items,
    filteredItems,
    searchText,
    selectedFilter,
    isLoading,
    isInitialized,

    // Actions
    initialize,
    loadItems,
    createItem,
    updateItem,
    deleteItem,
    toggleComplete,
    convertToEvent,
    convertToTask,
    setSearchText,
    setFilter,
  };
}
