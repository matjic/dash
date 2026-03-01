import { v4 as uuidv4 } from 'uuid';
import type { DashItem, RecurrenceRule } from '../models/DashItem';

const OCCURRENCES_TO_CREATE = 10;

class RecurrenceService {
  createRecurringTasks(originalItem: DashItem): DashItem[] {
    if (!originalItem.isRecurring || !originalItem.recurrenceRule || !originalItem.dueDate) {
      return [];
    }

    const recurringTasks: DashItem[] = [];
    let currentDate = new Date(originalItem.dueDate);

    for (let i = 0; i < OCCURRENCES_TO_CREATE; i++) {
      currentDate = this.calculateNextDate(currentDate, originalItem.recurrenceRule);

      const newTask: DashItem = {
        ...originalItem,
        id: uuidv4(),
        createdDate: new Date().toISOString(),
        dueDate: currentDate.toISOString(),
        isCompleted: false,
        // Don't copy reminder to future instances
        hasReminder: false,
        reminderDate: undefined,
      };

      recurringTasks.push(newTask);
    }

    return recurringTasks;
  }

  private calculateNextDate(date: Date, rule: RecurrenceRule): Date {
    const nextDate = new Date(date);

    switch (rule) {
      case 'daily':
        nextDate.setDate(nextDate.getDate() + 1);
        break;
      case 'weekly':
        nextDate.setDate(nextDate.getDate() + 7);
        break;
      case 'monthly':
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
    }

    return nextDate;
  }
}

export const recurrenceService = new RecurrenceService();
