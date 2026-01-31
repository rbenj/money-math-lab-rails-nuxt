import { DEFAULT_BIRTH_MONTH, DEFAULT_BIRTH_YEAR } from '@/constants';

/**
 * Creates a normalized GMT/UTC date representing a single day at the start or end of that day.
 */
export function createUTCDayDate(
  year: number,
  month: number,
  day: number,
  endOfDay: boolean = false,
): Date {
  if (endOfDay) {
    return new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));
  }
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
}

/**
 * Creates an epoch day for a given date.
 */
export function createEpochDay(year: number, month: number, day: number): number {
  return dateToEpochDay(createUTCDayDate(year, month, day));
}

/**
 * Convert a UTC date to the number of days since Unix epoch.
 */
export function dateToEpochDay(date: Date): number {
  const utcMidnight = Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
  );

  return Math.floor(utcMidnight / 86400000);
}

/**
 * Convert a number of days since Unix epoch to a UTC date.
 */
export function epochDayToDate(day: number): Date {
  const epochStart = Date.UTC(1970, 0, 1);
  return new Date(epochStart + (day * 86400000));
}

/**
 * Convert epoch day (days since Unix epoch) to YYYY-MM-DD string.
 */
export function epochDayToDateString(epochDay: number): string {
  return formatDateString(epochDayToDate(epochDay));
}

/**
 * Parse a YYYY-MM-DD string to epoch day.
 */
export function dateStringToEpochDay(dateString: string): number {
  const { year, month, day } = parseDateString(dateString);
  return createEpochDay(year, month, day);
}

/**
 * Get today's date as YYYY-MM-DD string.
 */
export function getTodayDateString(): string {
  const today = new Date();
  return formatDateString(today);
}

/**
 * Format a Date object as YYYY-MM-DD string (UTC).
 */
export function formatDateString(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get all last days of months within a date range (inclusive).
 */
export function getLastDaysOfMonthsInRange(startDay: number, endDay: number): number[] {
  const days: number[] = [];

  const startDate = epochDayToDate(startDay);
  const endDate = epochDayToDate(endDay);

  for (let year = startDate.getUTCFullYear(); year <= endDate.getUTCFullYear(); year++) {
    const startMonth = (year === startDate.getUTCFullYear()) ? startDate.getUTCMonth() : 0;
    const endMonth = (year === endDate.getUTCFullYear()) ? endDate.getUTCMonth() : 11;

    for (let month = startMonth; month <= endMonth; month++) {
      // Get last day of month (day 0 of next month)
      const lastDayOfMonth = new Date(Date.UTC(year, month + 1, 0));
      const day = dateToEpochDay(lastDayOfMonth);

      if (day >= startDay && day <= endDay) {
        days.push(day);
      }
    }
  }

  return days;
}

/**
 * Parse a YYYY-MM-DD string into year, month, day parts.
 */
export function parseDateString(dateStr: string): { year: number; month: number; day: number } {
  const [year, month, day] = dateStr.split('-').map(Number);
  return { year: year || 1970, month: month || 1, day: day || 1 };
}

/**
 * Convert month and year to an ISO date string (15th of month).
 */
export function monthYearToDateString(month: number, year: number): string {
  if (month < 1 || month > 12 || year < 1900 || year > 2100) {
    return '';
  }
  return formatDateString(createUTCDayDate(year, month, 15));
}

/**
 * Convert an ISO date string to birth month and year.
 */
export function birthDateStringToMonthYear(dateStr: string | null | undefined): { month: number; year: number } {
  if (!dateStr || dateStr.length !== 10 || dateStr.charAt(4) !== '-' || dateStr.charAt(7) !== '-') {
    return { month: DEFAULT_BIRTH_MONTH, year: DEFAULT_BIRTH_YEAR };
  }
  const { year, month } = parseDateString(dateStr);
  return { month, year };
}

/**
 * Calculate age from birth date string.
 */
export function calculateAgeFromDate(today: Date, birthDate: string | null | undefined): number {
  if (!birthDate) {
    return today.getFullYear() - DEFAULT_BIRTH_YEAR;
  }

  const birth = new Date(birthDate);

  let age = today.getFullYear() - birth.getUTCFullYear();

  // If birthday hasn't occurred yet this year, subtract 1
  const birthMonth = birth.getUTCMonth();
  const currentMonth = today.getMonth();
  if (currentMonth < birthMonth || (currentMonth === birthMonth && today.getDate() < birth.getUTCDate())) {
    age -= 1;
  }

  return age;
}
