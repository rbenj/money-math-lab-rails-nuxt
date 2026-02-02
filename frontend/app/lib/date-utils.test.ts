import { describe, it, expect } from "vitest";
import {
  calculateAge,
  createEpochDay,
  dateStringToEpochDay,
  epochDayToDate,
  epochDayToDateString,
  getLastDaysOfMonthsInRange,
  parseDateString,
} from "./date-utils";

describe("createEpochDay / epochDayToDate", () => {
  it("round-trips a date correctly", () => {
    const epochDay = createEpochDay(2024, 6, 15);
    const date = epochDayToDate(epochDay);

    expect(date.getUTCFullYear()).toBe(2024);
    expect(date.getUTCMonth()).toBe(5); // 0-indexed
    expect(date.getUTCDate()).toBe(15);
  });

  it("handles epoch day 0 as 1970-01-01", () => {
    const date = epochDayToDate(0);

    expect(date.getUTCFullYear()).toBe(1970);
    expect(date.getUTCMonth()).toBe(0);
    expect(date.getUTCDate()).toBe(1);
  });
});

describe("dateStringToEpochDay / epochDayToDateString", () => {
  it("round-trips a date string correctly", () => {
    const original = "2024-06-15";
    const epochDay = dateStringToEpochDay(original);
    const result = epochDayToDateString(epochDay);

    expect(result).toBe(original);
  });

  it("handles single-digit months and days with proper padding", () => {
    const original = "2024-01-05";
    const epochDay = dateStringToEpochDay(original);
    const result = epochDayToDateString(epochDay);

    expect(result).toBe(original);
  });
});

describe("calculateAge", () => {
  it("returns correct age when birthday has passed this year", () => {
    const birthDate = "1990-03-15";
    const today = createEpochDay(2024, 6, 1); // June 1, 2024

    expect(calculateAge(birthDate, today)).toBe(34);
  });

  it("returns age minus one when birthday has not occurred yet this year", () => {
    const birthDate = "1990-08-15";
    const today = createEpochDay(2024, 6, 1); // June 1, 2024

    expect(calculateAge(birthDate, today)).toBe(33);
  });

  it("handles Feb 29 birthday on non-leap year", () => {
    const birthDate = "2000-02-29"; // Leap year birth
    const today = createEpochDay(2023, 3, 1); // March 1, 2023 (non-leap year)

    // Birthday "passed" since we're past Feb 28
    expect(calculateAge(birthDate, today)).toBe(23);
  });
});

describe("getLastDaysOfMonthsInRange", () => {
  it("returns correct month-end days for a single year", () => {
    const startDay = createEpochDay(2024, 1, 1);
    const endDay = createEpochDay(2024, 3, 31);

    const result = getLastDaysOfMonthsInRange(startDay, endDay);

    expect(result).toHaveLength(3);
    // Jan 31, Feb 29 (2024 is leap year), Mar 31
    expect(epochDayToDateString(result[0]!)).toBe("2024-01-31");
    expect(epochDayToDateString(result[1]!)).toBe("2024-02-29");
    expect(epochDayToDateString(result[2]!)).toBe("2024-03-31");
  });

  it("handles multi-year range correctly", () => {
    const startDay = createEpochDay(2023, 11, 1);
    const endDay = createEpochDay(2024, 2, 29); // Feb 29 (leap year)

    const result = getLastDaysOfMonthsInRange(startDay, endDay);

    expect(result).toHaveLength(4);
    expect(epochDayToDateString(result[0]!)).toBe("2023-11-30");
    expect(epochDayToDateString(result[1]!)).toBe("2023-12-31");
    expect(epochDayToDateString(result[2]!)).toBe("2024-01-31");
    expect(epochDayToDateString(result[3]!)).toBe("2024-02-29");
  });
});

describe("parseDateString", () => {
  it("returns fallback values for invalid input", () => {
    const result = parseDateString("invalid");

    expect(result.year).toBe(1970);
    expect(result.month).toBe(1);
    expect(result.day).toBe(1);
  });
});
