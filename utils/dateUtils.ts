/**
 * Get current date string in Amsterdam timezone (YYYY-MM-DD format)
 * Used for consistent date handling across the app
 */
export function getAmsterdamDateString(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Amsterdam',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date());
}

/**
 * Get formatted date for display in Macedonian locale
 * @param includeYear Whether to include the year in the output
 */
export function getFormattedDisplayDate(includeYear: boolean = true): string {
  const options: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'long',
    timeZone: 'Europe/Amsterdam',
    ...(includeYear && { year: 'numeric' })
  };

  const dateStr = new Intl.DateTimeFormat('mk-MK', options).format(new Date());
  // Remove trailing "г." that Macedonian locale sometimes adds
  return dateStr.replace(/\s?г\.?$/, '');
}

