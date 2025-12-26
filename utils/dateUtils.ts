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

/**
 * Calculate time remaining until midnight Amsterdam timezone
 * @returns Formatted string "HH:MM:SS"
 */
export function getTimeUntilMidnightAmsterdam(): string {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Amsterdam',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false
  });

  const parts = formatter.formatToParts(now);
  const h = parseInt(parts.find(p => p.type === 'hour')?.value || '0', 10);
  const m = parseInt(parts.find(p => p.type === 'minute')?.value || '0', 10);
  const s = parseInt(parts.find(p => p.type === 'second')?.value || '0', 10);

  const totalSecondsNow = h * 3600 + m * 60 + s;
  const secondsInDay = 24 * 3600;
  let diffSeconds = secondsInDay - totalSecondsNow;
  if (diffSeconds < 0) diffSeconds = 0;

  const hours = Math.floor(diffSeconds / 3600);
  const minutes = Math.floor((diffSeconds % 3600) / 60);
  const seconds = diffSeconds % 60;

  const format = (n: number) => n.toString().padStart(2, '0');
  return `${format(hours)}:${format(minutes)}:${format(seconds)}`;
}

