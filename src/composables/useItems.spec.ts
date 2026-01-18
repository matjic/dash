import { describe, it, expect, beforeEach, vi } from 'vitest';
import { nextTick } from 'vue';
import { useItems } from './useItems';
import type { DashItem } from '../models/DashItem';

// Mock the database service
const mockDbItems: DashItem[] = [];
vi.mock('../services/database', () => ({
  databaseService: {
    initialize: vi.fn(() => Promise.resolve()),
    getAllItems: vi.fn(() => Promise.resolve([...mockDbItems])),
    createItem: vi.fn((item: DashItem) => {
      mockDbItems.push(item);
      return Promise.resolve();
    }),
    updateItem: vi.fn((item: DashItem) => {
      const index = mockDbItems.findIndex((i) => i.id === item.id);
      if (index !== -1) {
        mockDbItems[index] = item;
      }
      return Promise.resolve();
    }),
    deleteItem: vi.fn((id: string) => {
      const index = mockDbItems.findIndex((i) => i.id === id);
      if (index !== -1) {
        mockDbItems.splice(index, 1);
      }
      return Promise.resolve();
    }),
  },
}));

// Mock notification service
vi.mock('../services/notificationService', () => ({
  notificationService: {
    scheduleReminder: vi.fn(() => Promise.resolve()),
    cancelReminder: vi.fn(() => Promise.resolve()),
    updateReminder: vi.fn(() => Promise.resolve()),
  },
}));

// Mock photo service
vi.mock('../services/photoService', () => ({
  photoService: {
    initialize: vi.fn(() => Promise.resolve()),
    deletePhotos: vi.fn(() => Promise.resolve()),
  },
}));

// Mock recurrence service
vi.mock('../services/recurrenceService', () => ({
  recurrenceService: {
    createRecurringTasks: vi.fn(() => []),
  },
}));

describe('useItems', () => {
  beforeEach(() => {
    // Clear mock database
    mockDbItems.length = 0;

    // Reset the composable state by clearing items
    const { items, searchText, selectedFilter } = useItems();
    items.value = [];
    searchText.value = '';
    selectedFilter.value = 'all';

    vi.clearAllMocks();
  });

  function createTestTask(overrides: Partial<DashItem> = {}): Omit<DashItem, 'id' | 'createdDate'> {
    return {
      title: 'Test Task',
      links: [],
      photoPaths: [],
      itemType: 'task',
      isCompleted: false,
      dueDate: '2026-01-20T10:00:00.000Z',
      priority: 'medium',
      tags: ['work'],
      isRecurring: false,
      hasReminder: false,
      ...overrides,
    };
  }

  function createTestEvent(overrides: Partial<DashItem> = {}): Omit<DashItem, 'id' | 'createdDate'> {
    return {
      title: 'Test Event',
      links: [],
      photoPaths: [],
      itemType: 'event',
      isCompleted: false,
      eventDate: '2026-01-22T14:00:00.000Z',
      priority: 'none',
      tags: [],
      isRecurring: false,
      hasReminder: false,
      ...overrides,
    };
  }

  describe('state initialization', () => {
    it('should have empty items array initially', () => {
      const { items } = useItems();
      expect(items.value).toEqual([]);
    });

    it('should have default filter set to "all"', () => {
      const { selectedFilter } = useItems();
      expect(selectedFilter.value).toBe('all');
    });

    it('should have empty search text initially', () => {
      const { searchText } = useItems();
      expect(searchText.value).toBe('');
    });

    it('should not be loading initially', () => {
      const { isLoading } = useItems();
      expect(isLoading.value).toBe(false);
    });
  });

  describe('createItem', () => {
    it('should create a new item with generated id and createdDate', async () => {
      const { createItem, items } = useItems();

      const newItem = await createItem(createTestTask({ title: 'New Task' }));

      expect(newItem.id).toBeDefined();
      expect(newItem.id.length).toBeGreaterThan(0);
      expect(newItem.createdDate).toBeDefined();
      expect(newItem.title).toBe('New Task');
      expect(items.value).toContainEqual(newItem);
    });

    it('should add item to items array', async () => {
      const { createItem, items } = useItems();

      await createItem(createTestTask({ title: 'Task 1' }));
      await createItem(createTestTask({ title: 'Task 2' }));

      expect(items.value).toHaveLength(2);
    });
  });

  describe('updateItem', () => {
    it('should update existing item', async () => {
      const { createItem, updateItem, items } = useItems();

      const created = await createItem(createTestTask({ title: 'Original' }));
      const updated = { ...created, title: 'Updated' };

      await updateItem(updated);

      expect(items.value[0].title).toBe('Updated');
    });
  });

  describe('deleteItem', () => {
    it('should remove item from items array', async () => {
      const { createItem, deleteItem, items } = useItems();

      const item = await createItem(createTestTask({ title: 'To Delete' }));

      expect(items.value).toHaveLength(1);

      await deleteItem(item.id);

      expect(items.value).toHaveLength(0);
    });
  });

  describe('toggleComplete', () => {
    it('should toggle task completion status', async () => {
      const { createItem, toggleComplete, items } = useItems();

      const task = await createItem(createTestTask({ isCompleted: false }));

      expect(items.value[0].isCompleted).toBe(false);

      await toggleComplete(task.id);

      expect(items.value[0].isCompleted).toBe(true);
    });

    it('should toggle back to incomplete', async () => {
      const { createItem, toggleComplete, items } = useItems();

      const task = await createItem(createTestTask({ isCompleted: false }));

      await toggleComplete(task.id);
      await toggleComplete(task.id);

      expect(items.value[0].isCompleted).toBe(false);
    });

    it('should not toggle events', async () => {
      const { createItem, toggleComplete, items } = useItems();

      const event = await createItem(createTestEvent());

      await toggleComplete(event.id);

      expect(items.value[0].isCompleted).toBe(false);
    });
  });

  describe('convertToEvent', () => {
    it('should convert task to event', async () => {
      const { createItem, convertToEvent, items } = useItems();

      const task = await createItem(
        createTestTask({
          dueDate: '2026-01-20T10:00:00.000Z',
        })
      );

      await convertToEvent(task.id);

      expect(items.value[0].itemType).toBe('event');
      expect(items.value[0].eventDate).toBe('2026-01-20T10:00:00.000Z');
      expect(items.value[0].dueDate).toBeUndefined();
    });
  });

  describe('convertToTask', () => {
    it('should convert event to task', async () => {
      const { createItem, convertToTask, items } = useItems();

      const event = await createItem(
        createTestEvent({
          eventDate: '2026-01-22T14:00:00.000Z',
        })
      );

      await convertToTask(event.id);

      expect(items.value[0].itemType).toBe('task');
      expect(items.value[0].dueDate).toBe('2026-01-22T14:00:00.000Z');
      expect(items.value[0].eventDate).toBeUndefined();
    });
  });

  describe('filteredItems', () => {
    describe('type filtering', () => {
      it('should show all items when filter is "all"', async () => {
        const { createItem, filteredItems, setFilter } = useItems();

        await createItem(createTestTask({ title: 'Task' }));
        await createItem(createTestEvent({ title: 'Event' }));

        setFilter('all');
        await nextTick();

        expect(filteredItems.value).toHaveLength(2);
      });

      it('should show only tasks when filter is "tasks"', async () => {
        const { createItem, filteredItems, setFilter } = useItems();

        await createItem(createTestTask({ title: 'Task' }));
        await createItem(createTestEvent({ title: 'Event' }));

        setFilter('tasks');
        await nextTick();

        expect(filteredItems.value).toHaveLength(1);
        expect(filteredItems.value[0].itemType).toBe('task');
      });

      it('should show only events when filter is "events"', async () => {
        const { createItem, filteredItems, setFilter } = useItems();

        await createItem(createTestTask({ title: 'Task' }));
        await createItem(createTestEvent({ title: 'Event' }));

        setFilter('events');
        await nextTick();

        expect(filteredItems.value).toHaveLength(1);
        expect(filteredItems.value[0].itemType).toBe('event');
      });
    });

    describe('search filtering', () => {
      it('should filter by title', async () => {
        const { createItem, filteredItems, setSearchText } = useItems();

        await createItem(createTestTask({ title: 'Buy groceries' }));
        await createItem(createTestTask({ title: 'Call mom' }));

        setSearchText('groceries');
        await nextTick();

        expect(filteredItems.value).toHaveLength(1);
        expect(filteredItems.value[0].title).toBe('Buy groceries');
      });

      it('should filter by notes', async () => {
        const { createItem, filteredItems, setSearchText } = useItems();

        await createItem(createTestTask({ title: 'Task', notes: 'Important details' }));
        await createItem(createTestTask({ title: 'Other task' }));

        setSearchText('important');
        await nextTick();

        expect(filteredItems.value).toHaveLength(1);
        expect(filteredItems.value[0].notes).toBe('Important details');
      });

      it('should filter by location', async () => {
        const { createItem, filteredItems, setSearchText } = useItems();

        await createItem(createTestTask({ title: 'Meeting', location: 'Conference Room A' }));
        await createItem(createTestTask({ title: 'Other' }));

        setSearchText('conference');
        await nextTick();

        expect(filteredItems.value).toHaveLength(1);
        expect(filteredItems.value[0].location).toBe('Conference Room A');
      });

      it('should filter by tags', async () => {
        const { createItem, filteredItems, setSearchText } = useItems();

        await createItem(createTestTask({ title: 'Work task', tags: ['work', 'urgent'] }));
        await createItem(createTestTask({ title: 'Personal', tags: ['personal'] }));

        setSearchText('urgent');
        await nextTick();

        expect(filteredItems.value).toHaveLength(1);
        expect(filteredItems.value[0].tags).toContain('urgent');
      });

      it('should be case insensitive', async () => {
        const { createItem, filteredItems, setSearchText } = useItems();

        await createItem(createTestTask({ title: 'IMPORTANT Task' }));

        setSearchText('important');
        await nextTick();

        expect(filteredItems.value).toHaveLength(1);
      });

      it('should show all items when search is empty', async () => {
        const { createItem, filteredItems, setSearchText } = useItems();

        await createItem(createTestTask({ title: 'Task 1' }));
        await createItem(createTestTask({ title: 'Task 2' }));

        setSearchText('');
        await nextTick();

        expect(filteredItems.value).toHaveLength(2);
      });
    });

    describe('sorting', () => {
      it('should sort incomplete tasks before events', async () => {
        const { createItem, filteredItems } = useItems();

        await createItem(createTestEvent({ title: 'Event', eventDate: '2026-01-20T10:00:00.000Z' }));
        await createItem(createTestTask({ title: 'Incomplete Task', isCompleted: false, dueDate: '2026-01-21T10:00:00.000Z' }));

        await nextTick();

        expect(filteredItems.value[0].title).toBe('Incomplete Task');
        expect(filteredItems.value[1].title).toBe('Event');
      });

      it('should sort events before completed tasks', async () => {
        const { createItem, filteredItems } = useItems();

        await createItem(createTestTask({ title: 'Completed Task', isCompleted: true, dueDate: '2026-01-20T10:00:00.000Z' }));
        await createItem(createTestEvent({ title: 'Event', eventDate: '2026-01-21T10:00:00.000Z' }));

        await nextTick();

        expect(filteredItems.value[0].title).toBe('Event');
        expect(filteredItems.value[1].title).toBe('Completed Task');
      });

      it('should sort by date within same category (ascending)', async () => {
        const { createItem, filteredItems } = useItems();

        await createItem(createTestTask({ title: 'Later Task', isCompleted: false, dueDate: '2026-01-25T10:00:00.000Z' }));
        await createItem(createTestTask({ title: 'Earlier Task', isCompleted: false, dueDate: '2026-01-20T10:00:00.000Z' }));

        await nextTick();

        expect(filteredItems.value[0].title).toBe('Earlier Task');
        expect(filteredItems.value[1].title).toBe('Later Task');
      });

      it('should handle items without dates', async () => {
        const { createItem, filteredItems } = useItems();

        await createItem(createTestTask({ title: 'With Date', isCompleted: false, dueDate: '2026-01-20T10:00:00.000Z' }));
        await createItem(createTestTask({ title: 'Without Date', isCompleted: false, dueDate: undefined }));

        await nextTick();

        // Items with dates should come before items without dates
        expect(filteredItems.value[0].title).toBe('With Date');
        expect(filteredItems.value[1].title).toBe('Without Date');
      });
    });
  });

  describe('setSearchText', () => {
    it('should update searchText value', () => {
      const { searchText, setSearchText } = useItems();

      setSearchText('test query');

      expect(searchText.value).toBe('test query');
    });
  });

  describe('setFilter', () => {
    it('should update selectedFilter value', () => {
      const { selectedFilter, setFilter } = useItems();

      setFilter('tasks');
      expect(selectedFilter.value).toBe('tasks');

      setFilter('events');
      expect(selectedFilter.value).toBe('events');

      setFilter('all');
      expect(selectedFilter.value).toBe('all');
    });
  });
});
