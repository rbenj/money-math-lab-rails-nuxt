import { describe, it, expect } from "vitest";
import { createEpochDay, getLastDaysOfMonthsInRange } from "@/lib/date-utils";
import { Snapshot } from "@/features/simulation/snapshot";
import { EntityType } from "../types";
import { AccountEntity } from "./account-entity";

describe("AccountEntity", () => {
  const baseDay = createEpochDay(2024, 1, 1);

  describe("golden value tests - growth calculations", () => {
    it("compounds 5% annual growth correctly over 12 months", () => {
      // 5% annual = 0.05 / 12 = 0.004167 monthly rate
      // $10,000 × (1.004167)^12 = $10,511.62
      const account = new AccountEntity({
        id: "test",
        name: "Savings",
        templateKey: "savings",
        growthRate: 0.05,
        ledger: [{ day: baseDay, amount: 10000 }],
      });

      // Simulate 12 months of growth
      let currentValue = 10000;

      // Get month-end days for growth calculations
      const endDay = createEpochDay(2024, 12, 31);
      const monthEndDays = getLastDaysOfMonthsInRange(baseDay, endDay);

      // Simulate each month
      const snapshots: Snapshot[] = [new Snapshot({ day: baseDay, amount: currentValue })];

      for (const day of monthEndDays) {
        const transactions = account.simulateDay(day, snapshots);
        if (transactions.length > 0) {
          currentValue += transactions[0]!.amount ?? 0;
          snapshots.push(new Snapshot({ day, amount: currentValue }));
        }
      }

      expect(currentValue).toBeCloseTo(10511.62, 2);
    });

    it("calculates correct growth for a single month", () => {
      // 5% annual / 12 months = 0.4167% monthly
      // $10,000 × 0.004167 = $41.67
      const account = new AccountEntity({
        id: "test",
        name: "Savings",
        templateKey: "savings",
        growthRate: 0.05,
        ledger: [{ day: baseDay, amount: 10000 }],
      });

      const snapshots = [new Snapshot({ day: baseDay, amount: 10000 })];
      const monthEndDay = createEpochDay(2024, 1, 31);

      const transactions = account.simulateDay(monthEndDay, snapshots);

      expect(transactions).toHaveLength(1);
      expect(transactions[0]!.amount).toBeCloseTo(41.67, 2);
    });

    it("returns zero growth when growth rate is 0%", () => {
      const account = new AccountEntity({
        id: "test",
        name: "Checking",
        templateKey: "checking",
        growthRate: 0,
        ledger: [{ day: baseDay, amount: 10000 }],
      });

      const snapshots = [new Snapshot({ day: baseDay, amount: 10000 })];
      const monthEndDay = createEpochDay(2024, 1, 31);
      const transactions = account.simulateDay(monthEndDay, snapshots);

      expect(transactions).toHaveLength(0);
    });

    it("handles negative growth rate (depreciation)", () => {
      // -10% annual depreciation
      const account = new AccountEntity({
        id: "test",
        name: "Vehicle",
        templateKey: "vehicle",
        growthRate: -0.1,
        ledger: [{ day: baseDay, amount: 30000 }],
      });

      // Simulate one month of depreciation
      const snapshots = [new Snapshot({ day: baseDay, amount: 30000 })];
      const monthEndDay = createEpochDay(2024, 1, 31);
      const transactions = account.simulateDay(monthEndDay, snapshots);

      // Monthly rate: -0.1 / 12 = -0.00833
      // Growth amount: 30000 * -0.00833 = -250
      expect(transactions).toHaveLength(1);
      expect(transactions[0]!.amount).toBeCloseTo(-250, 0);
    });

    it("returns zero growth when balance is 0", () => {
      const account = new AccountEntity({
        id: "test",
        name: "Empty",
        templateKey: "savings",
        growthRate: 0.05,
        ledger: [{ day: baseDay, amount: 0 }],
      });

      const snapshots = [new Snapshot({ day: baseDay, amount: 0 })];
      const monthEndDay = createEpochDay(2024, 1, 31);
      const transactions = account.simulateDay(monthEndDay, snapshots);

      expect(transactions).toHaveLength(0);
    });
  });

  describe("ledger correction transactions", () => {
    it("creates correction transaction on ledger day", () => {
      const account = new AccountEntity({
        id: "test",
        name: "Account",
        templateKey: "savings",
        growthRate: 0.05,
        ledger: [
          { day: baseDay, amount: 10000 },
          { day: baseDay + 30, amount: 15000 },
        ],
      });

      const snapshots = [new Snapshot({ day: baseDay, amount: 10000 })];
      const transactions = account.simulateDay(baseDay + 30, snapshots);

      expect(transactions).toHaveLength(1);
      expect(transactions[0]!.isCorrection).toBe(true);
      expect(transactions[0]!.amount).toBe(15000);
    });

    it("ledger day takes precedence over growth calculation", () => {
      const ledgerDay = createEpochDay(2024, 1, 31); // Also a month-end
      const account = new AccountEntity({
        id: "test",
        name: "Account",
        templateKey: "savings",
        growthRate: 0.05,
        ledger: [
          { day: baseDay, amount: 10000 },
          { day: ledgerDay, amount: 12000 }, // Manual correction on month-end
        ],
      });

      const snapshots = [new Snapshot({ day: baseDay, amount: 10000 })];
      const transactions = account.simulateDay(ledgerDay, snapshots);

      // Should return correction, not growth
      expect(transactions).toHaveLength(1);
      expect(transactions[0]!.isCorrection).toBe(true);
      expect(transactions[0]!.amount).toBe(12000);
    });
  });

  describe("getSimulationDays", () => {
    it("returns ledger days within range", () => {
      const account = new AccountEntity({
        id: "test",
        name: "Account",
        templateKey: "savings",
        growthRate: 0.05,
        ledger: [
          { day: baseDay, amount: 10000 },
          { day: baseDay + 60, amount: 12000 },
        ],
      });

      const days = account.getSimulationDays(baseDay, baseDay + 30);

      expect(days).toContain(baseDay);
      expect(days).not.toContain(baseDay + 60); // Outside range
    });

    it("includes month-end days for growth calculations", () => {
      const account = new AccountEntity({
        id: "test",
        name: "Account",
        templateKey: "savings",
        growthRate: 0.05,
        ledger: [{ day: baseDay, amount: 10000 }],
      });

      const endDay = createEpochDay(2024, 3, 31);
      const days = account.getSimulationDays(baseDay, endDay);

      // Should include Jan 31, Feb 29, Mar 31
      expect(days).toContain(createEpochDay(2024, 1, 31));
      expect(days).toContain(createEpochDay(2024, 2, 29));
      expect(days).toContain(createEpochDay(2024, 3, 31));
    });

    it("returns empty array when range is before ledger", () => {
      const account = new AccountEntity({
        id: "test",
        name: "Account",
        templateKey: "savings",
        growthRate: 0.05,
        ledger: [{ day: baseDay + 100, amount: 10000 }],
      });

      const days = account.getSimulationDays(baseDay, baseDay + 50);

      expect(days).toHaveLength(0);
    });
  });

  describe("serialization round-trip", () => {
    it("preserves all data through fromSerialized/toSerialized", () => {
      const original = new AccountEntity({
        id: "test-id",
        name: "My Savings",
        templateKey: "savings",
        growthRate: 0.035,
        parentId: "parent-id",
        ledger: [
          { day: baseDay, amount: 5000 },
          { day: baseDay + 30, amount: 5500 },
        ],
      });

      const serialized = original.toSerialized();
      const restored = AccountEntity.fromSerialized(serialized);

      expect(restored.id).toBe(original.id);
      expect(restored.name).toBe(original.name);
      expect(restored.templateKey).toBe(original.templateKey);
      expect(restored.growthRate).toBe(original.growthRate);
      expect(restored.parentId).toBe(original.parentId);
      expect(restored.ledger).toHaveLength(original.ledger.length);
      expect(restored.ledger[0]!.day).toBe(original.ledger[0]!.day);
      expect(restored.ledger[0]!.amount).toBe(original.ledger[0]!.amount);
    });

    it("serializes with correct entity type", () => {
      const account = new AccountEntity({
        id: "test",
        name: "Test",
        templateKey: "savings",
        growthRate: 0.05,
        ledger: [],
      });

      const serialized = account.toSerialized();

      expect(serialized.type).toBe(EntityType.Account);
    });
  });
});
