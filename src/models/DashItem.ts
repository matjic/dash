export type ItemType = 'task' | 'event';
export type Priority = 'none' | 'low' | 'medium' | 'high';
export type RecurrenceRule = 'daily' | 'weekly' | 'monthly';

export interface DashItem {
  id: string;
  title: string;
  notes?: string;
  createdDate: string;
  location?: string;
  links: string[];
  photoPaths: string[];
  itemType: ItemType;

  // Task-specific
  isCompleted: boolean;
  dueDate?: string;
  priority: Priority;
  tags: string[];
  isRecurring: boolean;
  recurrenceRule?: RecurrenceRule;
  hasReminder: boolean;
  reminderDate?: string;

  // Event-specific
  eventDate?: string;
  endDate?: string;
}

export function getRelevantDate(item: DashItem): string | undefined {
  return item.itemType === 'task' ? item.dueDate : item.eventDate;
}

export function isOverdue(item: DashItem): boolean {
  if (item.itemType !== 'task' || item.isCompleted || !item.dueDate) {
    return false;
  }
  return new Date(item.dueDate) < new Date();
}

export function createEmptyItem(type: ItemType = 'task'): DashItem {
  return {
    id: '',
    title: '',
    notes: '',
    createdDate: new Date().toISOString(),
    location: '',
    links: [],
    photoPaths: [],
    itemType: type,
    isCompleted: false,
    priority: 'none',
    tags: [],
    isRecurring: false,
    hasReminder: false,
  };
}
