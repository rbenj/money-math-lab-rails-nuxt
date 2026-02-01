import { createEpochDay, epochDayToDate, getTodayEpochDay } from "@/lib/date-utils";
import type { Entity } from "@/features/entity/entity";
import { FallbackEntity } from "@/features/entity/entity-types/fallback-entity";
import { Snapshot } from "./snapshot";
import type { Transaction } from "./transaction";

export interface DataPoint {
  assets: number;
  debt: number;
  netWorth: number;
}

export type DataPointsByDay = Map<number, DataPoint>;

type EntitiesByEntityId = Map<string, Entity>;

type SnapshotsByEntityId = Map<string, Snapshot[]>;

export class Simulation {
  public readonly startDay: number;
  public readonly endDay: number;

  private readonly entities: EntitiesByEntityId;
  private readonly snapshots: SnapshotsByEntityId;
  private readonly dataPoints: DataPointsByDay;
  private readonly fallbackEntity: FallbackEntity;

  public constructor(entities: Entity[], simulationYears: number, todayEpochDay?: number) {
    this.entities = new Map();
    this.snapshots = new Map();
    this.dataPoints = new Map();

    for (const entity of entities) {
      this.entities.set(entity.id, entity);
      this.snapshots.set(entity.id, []);
    }

    const fallbackEntity = entities.find((entity) => entity instanceof FallbackEntity);
    if (!fallbackEntity) {
      throw new Error("Fallback entity is missing");
    }
    this.fallbackEntity = fallbackEntity;

    let earliestDay: number | null = null;
    for (const entity of entities) {
      const firstEntryDay = entity.ledger[0]?.day;
      if (firstEntryDay !== undefined && (!earliestDay || firstEntryDay < earliestDay)) {
        earliestDay = firstEntryDay;
      }
    }

    if (!earliestDay) {
      earliestDay = todayEpochDay ?? getTodayEpochDay();
    }

    this.startDay = earliestDay;
    this.endDay = earliestDay + simulationYears * 365;

    this.runSimulation();
  }

  public getEntityValueForDay(entityId: string, day: number): number {
    const snapshots = this.snapshots.get(entityId);
    if (!snapshots) {
      return 0;
    }

    for (let i = snapshots.length - 1; i >= 0; i--) {
      const snapshot = snapshots[i];
      if (snapshot && snapshot.day <= day) {
        return snapshot.value;
      }
    }

    return 0;
  }

  public getDataPointsForAllYears(): DataPointsByDay {
    if (this.dataPoints.size === 0) {
      const startDate = epochDayToDate(this.startDay);
      const endDate = epochDayToDate(this.endDay);
      const startYear = startDate.getUTCFullYear();
      const endYear = endDate.getUTCFullYear();
      for (let year = startYear; year <= endYear; year++) {
        const lastDayOfYear = createEpochDay(year, 12, 31);

        const assets = this.getAssets(lastDayOfYear);
        const debt = this.getDebt(lastDayOfYear);
        const netWorth = this.getNetWorth(lastDayOfYear);

        this.dataPoints.set(lastDayOfYear, { assets, debt, netWorth });
      }
    }

    return this.dataPoints;
  }

  public getAssets(day: number): number {
    let totalValue = 0;
    for (const entityId of this.entities.keys()) {
      const value = this.getEntityValueForDay(entityId, day);
      if (value > 0) {
        totalValue += value;
      }
    }
    return totalValue;
  }

  public getDebt(day: number): number {
    let totalValue = 0;
    for (const entityId of this.entities.keys()) {
      const value = this.getEntityValueForDay(entityId, day);
      if (value < 0) {
        totalValue += Math.abs(value);
      }
    }
    return totalValue;
  }

  public getNetWorth(day: number): number {
    return this.getAssets(day) - this.getDebt(day);
  }

  private runSimulation(): void {
    const entitiesByDay = new Map<number, Entity[]>();
    for (const entity of this.entities.values()) {
      const days = entity.getSimulationDays(this.startDay, this.endDay);
      for (const day of days) {
        const entities = entitiesByDay.get(day) ?? [];
        entities.push(entity);
        entitiesByDay.set(day, entities);
      }
    }

    const allSimulationDays = Array.from(entitiesByDay.keys()).sort((a, b) => a - b);

    for (const day of allSimulationDays) {
      const entities = entitiesByDay.get(day) ?? [];
      for (const entity of entities) {
        const transactions = entity.simulateDay(day, this.snapshots.get(entity.id) || []);
        for (const transaction of transactions) {
          this.applyTransaction(transaction);
        }
      }
    }
  }

  private applyTransaction(transaction: Transaction): void {
    let entity = this.entities.get(transaction.targetEntityId);

    // If target entity is missing or unsigned, redirect to fallback entity
    if (!entity) {
      entity = this.fallbackEntity;
      transaction = transaction.copy({ targetEntityId: entity.id });
    }

    const snapshots = this.snapshots.get(entity.id) ?? [];
    this.snapshots.set(entity.id, snapshots);

    const lastSnapshot = snapshots[snapshots.length - 1];

    if (lastSnapshot && transaction.day < lastSnapshot.day) {
      throw new Error("Transaction applied out of order");
    }

    let amount = lastSnapshot?.amount ?? 0;
    let shareQuantity = lastSnapshot?.shareQuantity ?? 0;
    let sharePrice = lastSnapshot?.sharePrice ?? 0;

    if (transaction.isCorrection) {
      if (transaction.amount !== undefined) {
        amount = transaction.amount;
      }
      if (transaction.shareQuantity !== undefined) {
        shareQuantity = transaction.shareQuantity;
      }
      if (transaction.sharePrice !== undefined) {
        sharePrice = transaction.sharePrice;
      }
    } else {
      amount += transaction.amount ?? 0;
      shareQuantity += transaction.shareQuantity ?? 0;
      sharePrice += transaction.sharePrice ?? 0;
    }

    const newSnapshot = new Snapshot({
      day: transaction.day,
      amount,
      shareQuantity,
      sharePrice,
    });

    if (lastSnapshot?.day === transaction.day) {
      snapshots[snapshots.length - 1] = newSnapshot;
    } else {
      snapshots.push(newSnapshot);
    }
  }
}
