/**
 * Smart timestamp formatting utilities using Intl.DateTimeFormat (zero deps).
 */

/**
 * Formats a date with smart relative context:
 * - Today: "09:06 AM"
 * - This year: "Feb 19"
 * - Other year: "Feb 18, 2025"
 */
export function formatSmartTimestamp(date: Date): string {
  const now = new Date();
  const isToday =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  if (isToday) {
    return new Intl.DateTimeFormat(undefined, {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(date);
  }

  const isSameYear = date.getFullYear() === now.getFullYear();

  if (isSameYear) {
    return new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
    }).format(date);
  }

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

/**
 * Formats a full timestamp for tooltip display.
 * Always shows: "Feb 19, 2026, 09:50 AM"
 */
export function formatFullTimestamp(date: Date): string {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}
