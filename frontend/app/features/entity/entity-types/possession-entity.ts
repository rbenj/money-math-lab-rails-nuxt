import { getLastDaysOfMonthsInRange } from '@/lib/date-utils';
import { Transaction } from '@/features/simulation/transaction';
import type { Snapshot } from '@/features/simulation/snapshot';
import { EntityType, type SerializedEntity } from '../types';
import { Entity, type EntityInput } from '../entity';

interface PossessionEntityInput extends EntityInput {
  growthRate: number;
}

/**
 * Represents a possession entity (house, car, etc.) with value appreciation/depreciation.
 */
export class PossessionEntity extends Entity {
  public readonly growthRate: number;

  public static fromSerialized(data: SerializedEntity): PossessionEntity {
    return new PossessionEntity({
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
      growthRate: (data.data.growthRate as number) ?? 0,
    });
  }

  public constructor(input: PossessionEntityInput) {
    super(input);
    this.growthRate = input.growthRate;
  }

  public toSerialized(): SerializedEntity {
    return {
      ...this.serializeBase(EntityType.Possession),
      data: {
        growthRate: this.growthRate,
      },
    };
  }

  public getSimulationDays(startDay: number, endDay: number): number[] {
    const effectiveStartDay = Math.max(startDay, this.getEarliestDay());
    if (effectiveStartDay > endDay) {
      return [];
    }

    const days: number[] = [];

    // Include days from the ledger
    for (const ledgerEntry of this.ledger) {
      if (ledgerEntry.day >= effectiveStartDay && ledgerEntry.day <= endDay) {
        days.push(ledgerEntry.day);
      }
    }

    // Include last day of each month for growth
    const lastDaysOfMonths = getLastDaysOfMonthsInRange(effectiveStartDay, endDay);
    days.push(...lastDaysOfMonths);

    // Deduplicate and sort
    return Array.from(new Set(days)).sort((a, b) => a - b);
  }

  public simulateDay(day: number, snapshots: Snapshot[]): Transaction[] {
    const ledgerEntry = this.ledger.find(e => e.day === day);
    if (ledgerEntry) {
      return [
        new Transaction({
          day,
          targetEntityId: this.id,
          amount: ledgerEntry.amount,
          shareQuantity: ledgerEntry.shareQuantity,
          sharePrice: ledgerEntry.sharePrice,
          isCorrection: true,
        }),
      ];
    }

    const currentValue = snapshots[snapshots.length - 1]?.value ?? 0;
    if (this.growthRate === 0 || currentValue === 0) {
      return [];
    }

    const monthlyRate = this.growthRate / 12;
    const growthAmount = currentValue * monthlyRate;

    return growthAmount === 0 ? [] : [
      new Transaction({
        day,
        targetEntityId: this.id,
        amount: growthAmount,
      }),
    ];
  }
}
