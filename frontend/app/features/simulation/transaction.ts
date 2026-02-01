interface TransactionInput {
  day: number;
  targetEntityId: string;
  amount?: number;
  shareQuantity?: number;
  sharePrice?: number;
  isCorrection?: boolean;
}

/**
 * Data needed to apply a change to the value of an entity during simulation.
 */
export class Transaction {
  public readonly day: number;
  public readonly targetEntityId: string;
  public readonly amount?: number;
  public readonly shareQuantity?: number;
  public readonly sharePrice?: number;
  public readonly isCorrection: boolean; // Indicates that values should be interpreted as overrides, not deltas

  public constructor(input: TransactionInput) {
    this.day = input.day;
    this.targetEntityId = input.targetEntityId;
    this.amount = input.amount;
    this.shareQuantity = input.shareQuantity;
    this.sharePrice = input.sharePrice;
    this.isCorrection = input.isCorrection ?? false;
  }

  public copy(updates: Partial<TransactionInput>): Transaction {
    return new Transaction({ ...this, ...updates });
  }
}
