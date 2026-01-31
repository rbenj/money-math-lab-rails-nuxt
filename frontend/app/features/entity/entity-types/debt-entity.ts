import { dateToEpochDay, epochDayToDate, getLastDaysOfMonthsInRange } from '@/lib/date-utils';
import { Schedule, ScheduleType, type SerializedSchedule } from '@/lib/schedule';
import { Transaction } from '@/features/simulation/transaction';
import type { Snapshot } from '@/features/simulation/snapshot';
import { EntityType, type SerializedEntity } from '../types';
import { Entity, type EntityInput } from '../entity';

interface DebtEntityInput extends EntityInput {
  interestRate: number;
  paymentAmount: number;
  paymentSchedule: Schedule;
  paymentSourceEntityId: string;
}

export class DebtEntity extends Entity {
  public readonly interestRate: number;
  public readonly paymentAmount: number;
  public readonly paymentSchedule: Schedule;
  public readonly paymentSourceEntityId: string;

  /**
   * Create a DebtEntity from serialized data.
   */
  public static fromSerialized(data: SerializedEntity): DebtEntity {
    const paymentScheduleData = data.data.paymentSchedule as SerializedSchedule | undefined;
    return new DebtEntity({
      id: data.id,
      name: data.name,
      templateKey: data.templateKey,
      parentId: data.parentId ?? undefined,
      ledger: data.ledgerEntries.map(e => ({
        id: e.id,
        day: e.day,
        amount: e.amount ?? undefined,
        shareQuantity: e.shareQuantity ?? undefined,
        sharePrice: e.sharePrice ?? undefined,
      })),
      interestRate: (data.data.interestRate as number) ?? 0,
      paymentAmount: (data.data.paymentAmount as number) ?? 0,
      paymentSchedule: paymentScheduleData
        ? Schedule.fromSerialized(paymentScheduleData)
        : Schedule.fromSerialized({ type: ScheduleType.Monthly, daysOfMonth: [1], startDate: new Date().toISOString() }),
      paymentSourceEntityId: (data.data.paymentSourceEntityId as string) ?? '',
    });
  }

  public constructor(input: DebtEntityInput) {
    super(input);
    this.interestRate = input.interestRate;
    this.paymentAmount = input.paymentAmount;
    this.paymentSchedule = input.paymentSchedule;
    this.paymentSourceEntityId = input.paymentSourceEntityId;
  }

  public toSerialized(): SerializedEntity {
    return {
      ...this.serializeBase(EntityType.Debt),
      data: {
        interestRate: this.interestRate,
        paymentAmount: this.paymentAmount,
        paymentSchedule: this.paymentSchedule.toSerialized(),
        paymentSourceEntityId: this.paymentSourceEntityId,
      },
    };
  }

  public getSimulationDays(startDay: number, endDay: number): number[] {
    const effectiveStartDay = Math.max(startDay, this.getEarliestDay());
    if (effectiveStartDay > endDay) {
      return [];
    }

    const days: number[] = [];

    // Include days from the ledger (manual principal adjustments)
    for (const ledgerEntry of this.ledger) {
      if (ledgerEntry.day >= effectiveStartDay && ledgerEntry.day <= endDay) {
        days.push(ledgerEntry.day);
      }
    }

    // Include last day of each month for interest accrual
    const lastDaysOfMonths = getLastDaysOfMonthsInRange(effectiveStartDay, endDay);
    days.push(...lastDaysOfMonths);

    // Include payment schedule days
    const startDate = epochDayToDate(effectiveStartDay);
    const endDate = epochDayToDate(endDay);
    const scheduleDays = this.paymentSchedule
      .getDatesInRange(startDate, endDate)
      .map(date => dateToEpochDay(date));
    days.push(...scheduleDays);

    // Deduplicate and sort
    return Array.from(new Set(days)).sort((a, b) => a - b);
  }

  public simulateDay(day: number, snapshots: Snapshot[]): Transaction[] {
    const transactions: Transaction[] = [];

    // Check for ledger adjustment to principal
    const ledgerEntry = this.ledger.find(e => e.day === day);
    if (ledgerEntry) {
      transactions.push(
        new Transaction({
          day,
          targetEntityId: this.id,
          amount: ledgerEntry.amount,
          shareQuantity: ledgerEntry.shareQuantity,
          sharePrice: ledgerEntry.sharePrice,
          isCorrection: true,
        }),
      );
      return transactions;
    }

    const currentBalance = snapshots[snapshots.length - 1]?.value ?? 0;

    // Stop processing if debt is paid off
    if (snapshots.length > 0 && currentBalance >= 0) {
      return [];
    }

    const dayDate = epochDayToDate(day);

    // Process scheduled payment first
    const scheduleDates = this.paymentSchedule.getDatesInRange(dayDate, dayDate);
    const isPaymentDay = scheduleDates[0] && dateToEpochDay(scheduleDates[0]) === day;

    if (isPaymentDay && this.paymentAmount > 0) {
      transactions.push(
        new Transaction({
          day,
          targetEntityId: this.paymentSourceEntityId,
          amount: -this.paymentAmount,
        }),
      );

      transactions.push(
        new Transaction({
          day,
          targetEntityId: this.id,
          amount: this.paymentAmount,
        }),
      );
    }

    // Apply monthly interest after scheduled payment (on last day of month)
    const isLastDayOfMonth = dayDate.getUTCDate() === new Date(Date.UTC(
      dayDate.getUTCFullYear(),
      dayDate.getUTCMonth() + 1,
      0,
    )).getUTCDate();

    if (isLastDayOfMonth && this.interestRate !== 0 && currentBalance < 0) {
      const monthlyRate = this.interestRate / 12;
      const interestAmount = Math.abs(currentBalance) * monthlyRate;

      transactions.push(
        new Transaction({
          day,
          targetEntityId: this.id,
          amount: -interestAmount,
        }),
      );
    }

    return transactions;
  }
}
