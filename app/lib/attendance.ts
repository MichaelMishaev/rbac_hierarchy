/**
 * Attendance System Utilities
 * Handles time window validation and timezone logic for worker check-ins
 */

import { toZonedTime, fromZonedTime } from 'date-fns-tz';
import { format } from 'date-fns';

/**
 * Israel timezone constant
 */
export const ISRAEL_TZ = 'Asia/Jerusalem';

/**
 * Allowed check-in hours (06:00 - 22:00)
 */
export const ALLOWED_HOURS = {
  start: 6,
  end: 22,
} as const;

/**
 * Validates if current time is within allowed check-in window (06:00-22:00 Israel time)
 * @returns true if current time is between 06:00-22:00, false otherwise
 */
export function validateTimeWindow(): boolean {
  const now = new Date();
  const israelTime = toZonedTime(now, ISRAEL_TZ);
  const hour = israelTime.getHours();

  return hour >= ALLOWED_HOURS.start && hour < ALLOWED_HOURS.end;
}

/**
 * Gets the next allowed check-in time
 * @returns Date object for the next time window (06:00 today or tomorrow)
 */
export function getNextAllowedTime(): Date {
  const now = new Date();
  const israelTime = toZonedTime(now, ISRAEL_TZ);
  const hour = israelTime.getHours();

  if (hour < ALLOWED_HOURS.start) {
    // Before 06:00 - return today at 06:00
    israelTime.setHours(ALLOWED_HOURS.start, 0, 0, 0);
  } else {
    // After 22:00 - return tomorrow at 06:00
    israelTime.setDate(israelTime.getDate() + 1);
    israelTime.setHours(ALLOWED_HOURS.start, 0, 0, 0);
  }

  return fromZonedTime(israelTime, ISRAEL_TZ);
}

/**
 * Gets current Israel time as formatted string
 * @param formatStr - date-fns format string (default: 'HH:mm')
 * @returns Formatted time string
 */
export function getCurrentIsraelTime(formatStr: string = 'HH:mm'): string {
  const now = new Date();
  const israelTime = toZonedTime(now, ISRAEL_TZ);
  return format(israelTime, formatStr);
}

/**
 * Converts a date to Israel timezone and returns just the date portion (YYYY-MM-DD)
 * @param date - Date to convert (defaults to now)
 * @returns Date string in YYYY-MM-DD format
 */
export function getTodayDateInIsrael(date: Date = new Date()): string {
  const israelTime = toZonedTime(date, ISRAEL_TZ);
  return format(israelTime, 'yyyy-MM-dd');
}

/**
 * Checks if a given date string is today in Israel timezone
 * @param dateStr - Date string in YYYY-MM-DD format
 * @returns true if date is today, false otherwise
 */
export function isToday(dateStr: string): boolean {
  return dateStr === getTodayDateInIsrael();
}

/**
 * Gets time window error message in Hebrew
 * @returns Error message string
 */
export function getTimeWindowErrorMessage(): string {
  const currentTime = getCurrentIsraelTime();
  return `ניתן לסמן נוכחות רק בין השעות ${ALLOWED_HOURS.start}:00-${ALLOWED_HOURS.end}:00. השעה הנוכחית: ${currentTime}`;
}
