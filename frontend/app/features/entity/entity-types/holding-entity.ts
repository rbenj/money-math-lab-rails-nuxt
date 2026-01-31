import { getLastDaysOfMonthsInRange } from "@/lib/date-utils";
import { Transaction } from "@/features/simulation/transaction";
import type { Snapshot } from "@/features/simulation/snapshot";
import { EntityType, type SerializedEntity } from "../types";
import { Entity, type EntityInput } from "../entity";

interface HoldingEntityInput extends EntityInput {
  symbol: string;
  growthRate: number;
}

/**
 * Represents a holding entity (stock, ETF, etc.) with price growth.
 */
export class HoldingEntity extends Entity {
  public readonly symbol: string;
  public readonly growthRate: number;

  public static fromSerialized(data: SerializedEntity): HoldingEntity {
    return new HoldingEntity({
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
      symbol: (data.data.symbol as string) ?? "",
      growthRate: (data.data.growthRate as number) ?? 0,
    });
  }

  public constructor(input: HoldingEntityInput) {
    super(input);
    this.symbol = input.symbol;
    this.growthRate = input.growthRate;
  }

  public toSerialized(): SerializedEntity {
    return {
      ...this.serializeBase(EntityType.Holding),
      data: {
        symbol: this.symbol,
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
    // Return explicit ledger entry as a correction
    const ledgerEntry = this.ledger.find((e) => e.day === day);
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

    const last = snapshots[snapshots.length - 1];

    if (this.growthRate === 0 || !last || last.sharePrice <= 0) {
      return [];
    }

    return [
      new Transaction({
        day,
        targetEntityId: this.id,
        sharePrice: last.sharePrice + last.sharePrice * (this.growthRate / 12),
        isCorrection: true,
      }),
    ];
  }
}
