import type { Transaction } from "@/features/simulation/transaction";
import type { SerializedEntity } from "../types";
import { Entity } from "../entity";

export const FALLBACK_ENTITY_ID = "__fallback__";

/**
 * Special backup entity that transactions will be redirected to when their target is missing or
 * unassigned. This entity should never be serialized or deserialized.
 */
export class FallbackEntity extends Entity {
  public constructor() {
    super({
      id: FALLBACK_ENTITY_ID,
      name: "Cash",
      templateKey: "fallback",
    });
  }

  public toSerialized(): SerializedEntity {
    throw new Error("FallbackEntity cannot be serialized");
  }

  public getSimulationDays(): number[] {
    return [];
  }

  public simulateDay(): Transaction[] {
    return [];
  }
}
