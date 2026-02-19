import type { DashItem } from '../models/DashItem';

/**
 * Format a date to Google Calendar format: YYYYMMDDTHHmmss
 * Without the Z suffix, Google Calendar will use the user's local timezone.
 * 
 * Reference: https://github.com/InteractionDesignFoundation/add-event-to-calendar-docs/blob/main/services/google.md
 */
function formatDateForGoogleCalendar(dateString: string): string {
  const date = new Date(dateString);
  
  // Format in local time (without Z suffix) so Google uses user's timezone
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  return `${year}${month}${day}T${hours}${minutes}${seconds}`;
}

/**
 * Add hours to a date and return the new date string
 */
function addHours(dateString: string, hours: number): string {
  const date = new Date(dateString);
  date.setTime(date.getTime() + hours * 60 * 60 * 1000);
  return date.toISOString();
}

/**
 * Check if an item has a date that can be used for Google Calendar
 */
export function canGenerateCalendarLink(item: DashItem): boolean {
  return !!item.dueDate;
}

/**
 * Generate a Google Calendar "Add Event" URL for a DashItem
 * Returns null if the item doesn't have a relevant date
 * 
 * Google Calendar URL format:
 * https://calendar.google.com/calendar/render?action=TEMPLATE
 *   &text=Event+Title
 *   &dates=YYYYMMDDTHHmmss/YYYYMMDDTHHmmss (local time, no Z = user's timezone)
 *   &details=Description
 *   &location=Location
 * 
 * Reference: https://github.com/InteractionDesignFoundation/add-event-to-calendar-docs/blob/main/services/google.md
 */
export function generateGoogleCalendarLink(item: DashItem): string | null {
  if (!item.dueDate) return null;
  
  const startDate = item.dueDate;
  const endDate = addHours(item.dueDate, 1); // Default 1 hour duration

  // Format dates for Google Calendar (local time, user's timezone)
  const formattedStart = formatDateForGoogleCalendar(startDate);
  const formattedEnd = formatDateForGoogleCalendar(endDate);
  
  // Build URL manually to avoid encoding the "/" in dates
  // The dates parameter must have an unencoded "/" between start and end
  const baseUrl = 'https://calendar.google.com/calendar/render';
  const params: string[] = [
    'action=TEMPLATE',
    `text=${encodeURIComponent(item.title)}`,
    `dates=${formattedStart}/${formattedEnd}`,
  ];

  // Add optional fields
  if (item.notes) {
    params.push(`details=${encodeURIComponent(item.notes)}`);
  }

  if (item.location) {
    params.push(`location=${encodeURIComponent(item.location)}`);
  }

  return `${baseUrl}?${params.join('&')}`;
}
