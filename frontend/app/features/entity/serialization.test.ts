import { describe, it, expect } from "vitest";
import type { SerializedEntity } from "./types";
import { deserializeEntity, deserializeEntities } from "./serialization";
import { AccountEntity } from "./entity-types/account-entity";
import { DebtEntity } from "./entity-types/debt-entity";
import { ExpenseEntity } from "./entity-types/expense-entity";
import { HoldingEntity } from "./entity-types/holding-entity";
import { IncomeEntity } from "./entity-types/income-entity";
import { PossessionEntity } from "./entity-types/possession-entity";

describe("deserializeEntity", () => {
  const baseSerializedEntity: Omit<SerializedEntity, "type" | "data"> = {
    id: "test-id",
    name: "Test Entity",
    templateKey: "test-template",
    parentId: null,
    ledgerEntries: [{ day: 19724, amount: 1000 }],
  };

  it.each([
    ["account", AccountEntity, { growthRate: 0.05 }],
    [
      "debt",
      DebtEntity,
      {
        interestRate: 0.07,
        paymentAmount: 500,
        paymentSchedule: {
          type: "monthly",
          daysOfMonth: [1],
          startDate: "2024-01-01",
        },
        paymentSourceEntityId: "source-id",
      },
    ],
    [
      "expense",
      ExpenseEntity,
      {
        growthRate: 0.03,
        schedule: { type: "monthly", daysOfMonth: [15], startDate: "2024-01-01" },
        sourceEntityId: "source-id",
      },
    ],
    ["holding", HoldingEntity, { symbol: "VTI", growthRate: 0.08 }],
    [
      "income",
      IncomeEntity,
      {
        growthRate: 0.025,
        schedule: {
          type: "monthly",
          daysOfMonth: [1, 15],
          startDate: "2024-01-01",
        },
        targetEntityId: "target-id",
      },
    ],
    ["possession", PossessionEntity, { growthRate: 0.03 }],
  ] as const)("deserializes %s type correctly", (type, ExpectedClass, data) => {
    const serialized: SerializedEntity = {
      ...baseSerializedEntity,
      type,
      data,
    };

    const result = deserializeEntity(serialized);

    expect(result).toBeInstanceOf(ExpectedClass);
    expect(result.id).toBe("test-id");
    expect(result.name).toBe("Test Entity");
    expect(result.ledger).toHaveLength(1);
    expect(result.ledger[0]!.day).toBe(19724);
  });

  it("handles case-insensitive type matching", () => {
    const serialized: SerializedEntity = {
      ...baseSerializedEntity,
      type: "ACCOUNT",
      data: { growthRate: 0.05 },
    };

    const result = deserializeEntity(serialized);

    expect(result).toBeInstanceOf(AccountEntity);
  });

  it("throws error for unknown entity type", () => {
    const serialized: SerializedEntity = {
      ...baseSerializedEntity,
      type: "unknown_type",
      data: {},
    };

    expect(() => deserializeEntity(serialized)).toThrow("Unknown entity type: unknown_type");
  });
});

describe("deserializeEntities", () => {
  it("returns empty array for empty input", () => {
    const result = deserializeEntities([]);

    expect(result).toEqual([]);
  });

  it("preserves order of entities", () => {
    const entities: SerializedEntity[] = [
      {
        id: "first",
        name: "First",
        type: "account",
        templateKey: "savings",
        parentId: null,
        data: { growthRate: 0.05 },
        ledgerEntries: [],
      },
      {
        id: "second",
        name: "Second",
        type: "account",
        templateKey: "checking",
        parentId: null,
        data: { growthRate: 0.01 },
        ledgerEntries: [],
      },
      {
        id: "third",
        name: "Third",
        type: "possession",
        templateKey: "house",
        parentId: null,
        data: { growthRate: 0.03 },
        ledgerEntries: [],
      },
    ];

    const result = deserializeEntities(entities);

    expect(result).toHaveLength(3);
    expect(result[0]!.id).toBe("first");
    expect(result[1]!.id).toBe("second");
    expect(result[2]!.id).toBe("third");
  });
});

describe("round-trip serialization", () => {
  it("preserves AccountEntity data through serialization round-trip", () => {
    const original = new AccountEntity({
      id: "round-trip-test",
      name: "Round Trip Account",
      templateKey: "savings",
      growthRate: 0.045,
      parentId: "parent-123",
      ledger: [
        { day: 19724, amount: 10000 },
        { day: 19754, amount: 10500 },
      ],
    });

    const serialized = original.toSerialized();
    const restored = deserializeEntity(serialized) as AccountEntity;

    expect(restored.id).toBe(original.id);
    expect(restored.name).toBe(original.name);
    expect(restored.templateKey).toBe(original.templateKey);
    expect(restored.growthRate).toBe(original.growthRate);
    expect(restored.parentId).toBe(original.parentId);
    expect(restored.ledger).toHaveLength(original.ledger.length);
    expect(restored.ledger[0]!.day).toBe(original.ledger[0]!.day);
    expect(restored.ledger[0]!.amount).toBe(original.ledger[0]!.amount);
  });
});
