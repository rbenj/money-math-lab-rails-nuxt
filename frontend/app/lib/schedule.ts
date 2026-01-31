export enum ScheduleType {
  Once = "once",
  Daily = "daily",
  Weekly = "weekly",
  Monthly = "monthly",
  Yearly = "yearly",
  Custom = "custom",
}

interface ScheduleInput {
  type: ScheduleType;
  daysOfMonth?: number[]; // For monthly: [1, 15] for 1st and 15th (1-indexed)
  daysOfWeek?: number[]; // For weekly: [0, 6] (Sunday-Saturday)
  interval?: number; // For custom: Every N days
  startDate: Date;
  endDate?: Date;
}

export interface SerializedSchedule {
  type: ScheduleType;
  daysOfMonth?: number[];
  daysOfWeek?: number[];
  interval?: number;
  startDate: string; // ISO string (YYYY-MM-DDTHH:MM:SS.000Z)
  endDate?: string; // ISO string (YYYY-MM-DDTHH:MM:SS.000Z)
}

export class Schedule {
  public readonly type: ScheduleType;
  public readonly daysOfMonth?: number[];
  public readonly daysOfWeek?: number[];
  public readonly interval?: number;
  public readonly startDate: Date;
  public readonly endDate?: Date;

  /**
   * Create a Schedule from serialized data.
   */
  public static fromSerialized(data: SerializedSchedule): Schedule {
    const typeStr = (data.type?.toLowerCase() ?? "monthly") as ScheduleType;
    return new Schedule({
      type: Object.values(ScheduleType).includes(typeStr) ? typeStr : ScheduleType.Monthly,
      daysOfMonth: data.daysOfMonth,
      daysOfWeek: data.daysOfWeek,
      interval: data.interval,
      startDate: new Date(data.startDate),
      endDate: data.endDate ? new Date(data.endDate) : undefined,
    });
  }

  /**
   * Constructor.
   */
  public constructor(input: ScheduleInput) {
    if (input.type === ScheduleType.Monthly && !input.daysOfMonth) {
      throw new Error("Days of month are required for monthly schedule");
    }

    if (input.daysOfMonth) {
      input.daysOfMonth = Array.from(
        new Set(
          input.daysOfMonth.map((day) => Math.floor(day)).filter((day) => day >= 1 && day <= 31), // 1-indexed days
        ),
      ).sort((a, b) => a - b);
    }

    if (input.type === ScheduleType.Weekly && !input.daysOfWeek) {
      throw new Error("Days of week are required for weekly schedule");
    }

    if (input.daysOfWeek) {
      input.daysOfWeek = Array.from(
        new Set(
          input.daysOfWeek.map((day) => Math.floor(day)).filter((day) => day >= 0 && day <= 6),
        ),
      ).sort((a, b) => a - b);
    }

    if (input.type === ScheduleType.Custom && !input.interval) {
      throw new Error("Interval is required for custom schedule");
    }

    if (input.interval) {
      input.interval = Math.max(1, Math.floor(input.interval));
    }

    if (input.endDate && input.startDate > input.endDate) {
      throw new Error("Start date must be before end date");
    }

    this.type = input.type;
    this.daysOfMonth = input.daysOfMonth;
    this.daysOfWeek = input.daysOfWeek;
    this.interval = input.interval;
    this.startDate = input.startDate;
    this.endDate = input.endDate;
  }

  /**
   * Convert to serialized data.
   */
  public toSerialized(): SerializedSchedule {
    return {
      type: this.type,
      daysOfMonth: this.daysOfMonth,
      daysOfWeek: this.daysOfWeek,
      interval: this.interval,
      startDate: this.startDate.toISOString(),
      endDate: this.endDate?.toISOString(),
    };
  }

  /**
   * Get dates in range.
   */
  public getDatesInRange(startDate: Date, endDate: Date): Date[] {
    const dates: Date[] = [];
    const effectiveStart = this.startDate > startDate ? this.startDate : startDate;
    const effectiveEnd = this.endDate && this.endDate < endDate ? this.endDate : endDate;

    if (effectiveStart > effectiveEnd) {
      return dates;
    }

    switch (this.type) {
      case ScheduleType.Once: {
        if (this.startDate >= effectiveStart && this.startDate <= effectiveEnd) {
          dates.push(new Date(this.startDate));
        }
        break;
      }

      case ScheduleType.Daily: {
        const current = new Date(effectiveStart);
        while (current <= effectiveEnd) {
          dates.push(new Date(current));
          current.setUTCDate(current.getUTCDate() + 1);
        }
        break;
      }

      case ScheduleType.Weekly: {
        if (!this.daysOfWeek || this.daysOfWeek.length === 0) {
          break;
        }
        const current = new Date(effectiveStart);
        while (current <= effectiveEnd) {
          const dayOfWeek = current.getUTCDay();
          if (this.daysOfWeek.includes(dayOfWeek)) {
            dates.push(new Date(current));
          }
          current.setUTCDate(current.getUTCDate() + 1);
        }
        break;
      }

      case ScheduleType.Monthly: {
        if (!this.daysOfMonth || this.daysOfMonth.length === 0) {
          break;
        }
        const current = new Date(effectiveStart);
        while (current <= effectiveEnd) {
          const dayOfMonth = current.getUTCDate(); // 1-31
          if (this.daysOfMonth.includes(dayOfMonth)) {
            dates.push(new Date(current));
          }
          current.setUTCDate(current.getUTCDate() + 1);
        }
        break;
      }

      case ScheduleType.Yearly: {
        const refMonth = this.startDate.getUTCMonth();
        const refDay = this.startDate.getUTCDate();

        const startYear = effectiveStart.getUTCFullYear();
        const endYear = effectiveEnd.getUTCFullYear();

        for (let year = startYear; year <= endYear; year++) {
          const yearDate = new Date(Date.UTC(year, refMonth, refDay));

          // Check if this date is valid (handles Feb 29 in non-leap years)
          if (yearDate.getUTCMonth() === refMonth && yearDate.getUTCDate() === refDay) {
            if (yearDate >= effectiveStart && yearDate <= effectiveEnd) {
              dates.push(yearDate);
            }
          }
        }
        break;
      }

      case ScheduleType.Custom: {
        if (!this.interval || this.interval <= 0) {
          break;
        }
        const current = new Date(effectiveStart);
        while (current <= effectiveEnd) {
          dates.push(new Date(current));
          current.setUTCDate(current.getUTCDate() + this.interval);
        }
        break;
      }
    }

    return dates;
  }
}
