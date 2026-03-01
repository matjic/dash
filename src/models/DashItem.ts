export type Priority = 'none' | 'low' | 'medium' | 'high';
export type RecurrenceRule = 'daily' | 'weekly' | 'monthly';

export interface Comment {
  id: string;
  text: string;
  imagePath?: string;
  createdDate: string;
  updatedDate?: string;
}

export interface Attachment {
  id: string;
  name: string;
  path: string; // Relative path in Documents/attachments/
  mimeType: string;
  size: number; // File size in bytes
  createdDate: string;
}

export interface DashItem {
  id: string;
  title: string;
  notes?: string;
  createdDate: string;
  updatedDate?: string;
  location?: string;
  links: string[];
  photoPaths: string[];
  comments: Comment[];
  attachments: Attachment[];

  // Task fields
  isCompleted: boolean;
  dueDate?: string;
  priority: Priority;
  tags: string[];
  isRecurring: boolean;
  recurrenceRule?: RecurrenceRule;
  hasReminder: boolean;
  reminderDate?: string;
}

export function getRelevantDate(item: DashItem): string | undefined {
  return item.dueDate;
}

export function isOverdue(item: DashItem): boolean {
  if (item.isCompleted || !item.dueDate) {
    return false;
  }
  return new Date(item.dueDate) < new Date();
}

export function createEmptyItem(): DashItem {
  return {
    id: '',
    title: '',
    notes: '',
    createdDate: new Date().toISOString(),
    location: '',
    links: [],
    photoPaths: [],
    comments: [],
    attachments: [],
    isCompleted: false,
    priority: 'none',
    tags: [],
    isRecurring: false,
    hasReminder: false,
  };
}
