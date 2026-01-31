import type { Entity } from "./entity";
import type { SerializedEntity } from "./types";
import { AccountEntity } from "./entity-types/account-entity";
import { DebtEntity } from "./entity-types/debt-entity";
import { ExpenseEntity } from "./entity-types/expense-entity";
import { HoldingEntity } from "./entity-types/holding-entity";
import { IncomeEntity } from "./entity-types/income-entity";
import { PossessionEntity } from "./entity-types/possession-entity";

/**
 * Create an entity fo the proper type from serialized data.
 */
export function deserializeEntity(data: SerializedEntity): Entity {
  const type = data.type.toLowerCase();

  switch (type) {
    case "account":
      return AccountEntity.fromSerialized(data);
    case "debt":
      return DebtEntity.fromSerialized(data);
    case "expense":
      return ExpenseEntity.fromSerialized(data);
    case "holding":
      return HoldingEntity.fromSerialized(data);
    case "income":
      return IncomeEntity.fromSerialized(data);
    case "possession":
      return PossessionEntity.fromSerialized(data);
    default:
      throw new Error(`Unknown entity type: ${type}`);
  }
}

/**
 * Deserialize multiple entities.
 */
export function deserializeEntities(data: SerializedEntity[]): Entity[] {
  return data.map((d) => deserializeEntity(d));
}
