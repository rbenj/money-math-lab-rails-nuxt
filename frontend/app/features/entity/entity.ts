import type { EntityType, Ledger, SerializedEntity, SerializedLedgerEntry } from "./types";
import type { Snapshot } from "@/features/simulation/snapshot";
import type { Transaction } from "@/features/simulation/transaction";

export interface EntityInput {
  id: string;
  name: string;
  templateKey: string;
  parentId?: string;
  ledger?: Ledger;
}

function serializeLedger(ledger: Ledger): SerializedLedgerEntry[] {
  return ledger.map((e) => ({
    id: e.id,
    day: e.day,
    amount: e.amount,
    shareQuantity: e.shareQuantity,
    sharePrice: e.sharePrice,
  }));
}

/**
 * Entities represent anything that the user is tracking and wants to simulate.
 */
export abstract class Entity {
  public readonly id: string;
  public readonly name: string;
  public readonly templateKey: string;
  public readonly parentId?: string;
  public readonly ledger: Ledger;

  public constructor(input: EntityInput) {
    this.id = input.id;
    this.name = input.name;
    this.templateKey = input.templateKey;
    this.parentId = input.parentId;
    this.ledger = input.ledger || [];
  }

  public abstract toSerialized(): SerializedEntity;

  public getSerializedBase(type: EntityType): Omit<SerializedEntity, "data"> {
    return {
      id: this.id,
      name: this.name,
      type,
      templateKey: this.templateKey,
      parentId: this.parentId ?? null,
      ledgerEntries: serializeLedger(this.ledger),
    };
  }

  public getEarliestDay(): number {
    return this.ledger[0]?.day ?? 0;
  }

  /**
   * Produce a list of days within the window (inclusive) that should be simulated.
   */
  public abstract getSimulationDays(startDay: number, endDay: number): number[];

  /**
   * Simulate a day to produce transactions to apply to target entities.
   */
  public abstract simulateDay(day: number, snapshots: Snapshot[]): Transaction[];
}
