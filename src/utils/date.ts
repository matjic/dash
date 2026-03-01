/**
 * Centralized date formatting utilities used across the app.
 */

/** Format a date string with month, day, year, hour, and minute. */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/** Format a date relative to now (omits year if same year). */
export function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();

  return date.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    hour: 'numeric',
    minute: '2-digit',
  });
}

/** Format a comment date (month, day, hour, minute). */
export function formatCommentDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/** Format a date nicely with weekday (omits year if same year). */
export function formatDateNice(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const isThisYear = date.getFullYear() === now.getFullYear();

  return date.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: isThisYear ? undefined : 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/** Format a date in short form (month, day, year). */
export function formatDateShort(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
