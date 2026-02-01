interface SnapshotInput {
  day: number;
  amount?: number; // The amount of value for a balance style entity
  shareQuantity?: number; // The quantity of shares in a holding style entity
  sharePrice?: number; // The price per share in a holding style entity
}

/**
 * Represents the value of an entity at a specific day in the simulation.
 */
export class Snapshot {
  public readonly day: number;
  public readonly amount: number;
  public readonly shareQuantity: number;
  public readonly sharePrice: number;

  public constructor(input: SnapshotInput) {
    this.day = input.day;
    this.amount = input.amount ?? 0;
    this.shareQuantity = input.shareQuantity ?? 0;
    this.sharePrice = input.sharePrice ?? 0;
  }

  public get value(): number {
    return this.amount === 0 ? this.shareQuantity * this.sharePrice : this.amount;
  }

  public copy(updates: Partial<SnapshotInput>): Snapshot {
    return new Snapshot({ ...this, ...updates });
  }
}
