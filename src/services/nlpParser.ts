import * as chrono from 'chrono-node';
import type { Priority, RecurrenceRule } from '../models/DashItem';

export interface ParsedInput {
  title: string;
  dueDate?: Date;
  priority: Priority;
  isRecurring: boolean;
  recurrenceRule?: RecurrenceRule;
}

const PRIORITY_PATTERNS = {
  high: /\b(high priority|urgent|asap|important)\b/gi,
  medium: /\b(medium priority|normal priority)\b/gi,
  low: /\b(low priority|low)\b/gi,
};

const RECURRENCE_PATTERNS = {
  daily: /\b(daily|every day)\b/gi,
  weekly: /\b(weekly|every week)\b/gi,
  monthly: /\b(monthly|every month)\b/gi,
};

export function parseQuickInput(text: string): ParsedInput {
  let cleanedText = text.trim();
  let priority: Priority = 'none';
  let isRecurring = false;
  let recurrenceRule: RecurrenceRule | undefined;
  let dueDate: Date | undefined;

  // Extract priority
  for (const [level, pattern] of Object.entries(PRIORITY_PATTERNS)) {
    if (pattern.test(cleanedText)) {
      priority = level as Priority;
      cleanedText = cleanedText.replace(pattern, '').trim();
      break;
    }
  }

  // Extract recurrence
  for (const [rule, pattern] of Object.entries(RECURRENCE_PATTERNS)) {
    if (pattern.test(cleanedText)) {
      isRecurring = true;
      recurrenceRule = rule as RecurrenceRule;
      cleanedText = cleanedText.replace(pattern, '').trim();
      break;
    }
  }

  // Extract dates using chrono-node
  const parsedDates = chrono.parse(cleanedText);
  if (parsedDates.length > 0 && parsedDates[0]) {
    const firstDate = parsedDates[0];
    dueDate = firstDate.start.date();
    
    // Remove the date text from the title
    const dateText = firstDate.text;
    cleanedText = cleanedText.replace(dateText, '').trim();
  }

  // Clean up extra whitespace
  cleanedText = cleanedText.replace(/\s+/g, ' ').trim();

  return {
    title: cleanedText,
    dueDate,
    priority,
    isRecurring,
    recurrenceRule,
  };
}
