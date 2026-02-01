import { DEFAULT_BIRTH_MONTH, DEFAULT_BIRTH_YEAR } from "@/constants";

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

export function createEpochDay(year: number, month: number, day: number): number {
  return dateToEpochDay(createUTCDayDate(year, month, day));
}

export function dateToEpochDay(date: Date): number {
  const utcMidnight = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());

  return Math.floor(utcMidnight / 86400000);
}

export function epochDayToDate(day: number): Date {
  const epochStart = Date.UTC(1970, 0, 1);
  return new Date(epochStart + day * 86400000);
}

export function epochDayToDateString(epochDay: number): string {
  return formatDateString(epochDayToDate(epochDay));
}

export function dateStringToEpochDay(dateString: string): number {
  const { year, month, day } = parseDateString(dateString);
  return createEpochDay(year, month, day);
}

export function getTodayEpochDay(): number {
  return dateToEpochDay(new Date());
}

export function getTodayDateString(): string {
  return formatDateString(new Date());
}

export function formatDateString(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getLastDaysOfMonthsInRange(startDay: number, endDay: number): number[] {
  const days: number[] = [];

  const startDate = epochDayToDate(startDay);
  const endDate = epochDayToDate(endDay);

  for (let year = startDate.getUTCFullYear(); year <= endDate.getUTCFullYear(); year++) {
    const startMonth = year === startDate.getUTCFullYear() ? startDate.getUTCMonth() : 0;
    const endMonth = year === endDate.getUTCFullYear() ? endDate.getUTCMonth() : 11;

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

export function parseDateString(dateStr: string): { year: number; month: number; day: number } {
  const [year, month, day] = dateStr.split("-").map(Number);
  return { year: year || 1970, month: month || 1, day: day || 1 };
}

export function monthYearToDateString(month: number, year: number): string {
  if (month < 1 || month > 12 || year < 1900 || year > 2100) {
    return "";
  }
  return formatDateString(createUTCDayDate(year, month, 15));
}

export function birthDateStringToMonthYear(dateStr: string | null | undefined): {
  month: number;
  year: number;
} {
  if (!dateStr || dateStr.length !== 10 || dateStr.charAt(4) !== "-" || dateStr.charAt(7) !== "-") {
    return { month: DEFAULT_BIRTH_MONTH, year: DEFAULT_BIRTH_YEAR };
  }
  const { year, month } = parseDateString(dateStr);
  return { month, year };
}

export function calculateAge(birthDate: string | null | undefined, todayEpochDay?: number): number {
  const today = todayEpochDay !== undefined ? epochDayToDate(todayEpochDay) : new Date();
  const todayYear = today.getUTCFullYear();
  const todayMonth = today.getUTCMonth();
  const todayDay = today.getUTCDate();

  if (!birthDate) {
    return todayYear - DEFAULT_BIRTH_YEAR;
  }

  const { year: birthYear, month: birthMonth, day: birthDay } = parseDateString(birthDate);

  let age = todayYear - birthYear;

  // If birthday hasn't occurred yet this year, subtract 1
  if (todayMonth + 1 < birthMonth || (todayMonth + 1 === birthMonth && todayDay < birthDay)) {
    age -= 1;
  }

  return age;
}
