import { formatInTimeZone, toZonedTime } from 'date-fns-tz';

/**
 * Get "today" date string (YYYY-MM-DD) for a user's timezone
 * @param timezone - IANA timezone identifier (e.g., "Asia/Kolkata", "America/New_York")
 * @returns Date string in user's timezone
 */
export function getTodayForUser(timezone: string): string {
  try {
    return formatInTimeZone(new Date(), timezone, 'yyyy-MM-dd');
  } catch (error) {
    console.error(`Invalid timezone ${timezone}, falling back to UTC:`, error);
    return new Date().toISOString().split('T')[0];
  }
}

/**
 * Get start of day (midnight) in user's timezone as UTC Date
 * Used for queries like "users active today"
 * @param timezone - IANA timezone identifier
 * @param date - Optional date to get start of day for (defaults to now)
 * @returns UTC Date object representing midnight in user's timezone
 */
export function getStartOfDayInUserTZ(timezone: string, date: Date = new Date()): Date {
  try {
    const zonedDate = toZonedTime(date, timezone);
    zonedDate.setHours(0, 0, 0, 0);
    return zonedDate;
  } catch (error) {
    console.error(`Invalid timezone ${timezone}:`, error);
    const utcDate = new Date(date);
    utcDate.setUTCHours(0, 0, 0, 0);
    return utcDate;
  }
}
