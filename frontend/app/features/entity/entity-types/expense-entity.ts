import { dateToEpochDay, epochDayToDate } from "@/lib/date-utils";
import { Schedule, ScheduleType, type SerializedSchedule } from "@/lib/schedule";
import { Transaction } from "@/features/simulation/transaction";
import { EntityType, type SerializedEntity } from "../types";
import { Entity, type EntityInput } from "../entity";

interface ExpenseEntityInput extends EntityInput {
  growthRate: number;
  schedule: Schedule;
  sourceEntityId: string;
}

export class ExpenseEntity extends Entity {
  public readonly growthRate: number;
  public readonly schedule: Schedule;
  public readonly sourceEntityId: string;

  /**
   * Create an ExpenseEntity from serialized data.
   */
  public static fromSerialized(data: SerializedEntity): ExpenseEntity {
    const scheduleData = data.data.schedule as SerializedSchedule | undefined;
    return new ExpenseEntity({
      id: data.id,
      name: data.name,
      templateKey: data.templateKey,
      parentId: data.parentId ?? undefined,
      ledger: data.ledgerEntries.map((e) => ({
        id: e.id,
        day: e.day,
        amount: e.amount ?? undefined,
        shareQuantity: e.shareQuantity ?? undefined,
        sharePrice: e.sharePrice ?? undefined,
      })),
      growthRate: (data.data.growthRate as number) ?? 0,
      schedule: scheduleData
        ? Schedule.fromSerialized(scheduleData)
        : Schedule.fromSerialized({
            type: ScheduleType.Monthly,
            daysOfMonth: [1],
            startDate: new Date().toISOString(),
          }),
      sourceEntityId: (data.data.sourceEntityId as string) ?? "",
    });
  }

  public constructor(input: ExpenseEntityInput) {
    super(input);
    this.growthRate = input.growthRate;
    this.schedule = input.schedule;
    this.sourceEntityId = input.sourceEntityId;
  }

  public toSerialized(): SerializedEntity {
    return {
      ...this.getSerializedBase(EntityType.Expense),
      data: {
        growthRate: this.growthRate,
        schedule: this.schedule.toSerialized(),
        sourceEntityId: this.sourceEntityId,
      },
    };
  }

  public getSimulationDays(startDay: number, endDay: number): number[] {
    const effectiveStartDay = Math.max(startDay, this.getEarliestDay());
    if (effectiveStartDay > endDay) {
      return [];
    }

    const days: number[] = [];

    // Get days from the schedule
    const startDate = epochDayToDate(effectiveStartDay);
    const endDate = epochDayToDate(endDay);
    const scheduleDates = this.schedule.getDatesInRange(startDate, endDate);
    const scheduleDays = scheduleDates.map((date) => dateToEpochDay(date));
    days.push(...scheduleDays);

    // Deduplicate and sort
    return Array.from(new Set(days)).sort((a, b) => a - b);
  }

  public simulateDay(day: number): Transaction[] {
    // Find the most recent ledger entry on or before this day
    const ledgerEntry = [...this.ledger].reverse().find((e) => e.day <= day);

    if (!ledgerEntry) {
      return [];
    }

    // Use the base amount from the most recent ledger entry
    const baseAmount = ledgerEntry.amount ?? 0;

    if (baseAmount === 0) {
      return [];
    }

    // Calculate amount with growth from ledger entry date
    const yearsSinceEntry = (day - ledgerEntry.day) / 365.25;
    const amount = baseAmount * Math.pow(1 + this.growthRate, yearsSinceEntry);

    return [
      new Transaction({
        day,
        targetEntityId: this.sourceEntityId,
        amount: -amount,
      }),
    ];
  }
}
