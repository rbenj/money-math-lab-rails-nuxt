import { describe, it, expect } from "vitest";
import { createEpochDay } from "@/lib/date-utils";
import { Schedule, ScheduleType } from "@/lib/schedule";
import { FallbackEntity } from "@/features/entity/entity-types/fallback-entity";
import { AccountEntity } from "@/features/entity/entity-types/account-entity";
import { IncomeEntity } from "@/features/entity/entity-types/income-entity";
import { Simulation } from "./simulation";

function createAccount(
  id: string,
  name: string,
  amount: number,
  day: number,
  growthRate = 0,
): AccountEntity {
  return new AccountEntity({
    id,
    name,
    templateKey: "savings",
    growthRate,
    ledger: [{ day, amount }],
  });
}

describe("Simulation", () => {
  const baseDay = createEpochDay(2024, 1, 1);

  describe("getAssets", () => {
    it("sums only positive entity values", () => {
      const account = createAccount("account1", "Savings", 10000, baseDay);
      const debt = createAccount("debt1", "Loan", -5000, baseDay);
      const fallback = new FallbackEntity();

      const sim = new Simulation([fallback, account, debt], 1, baseDay);

      expect(sim.getAssets(baseDay)).toBe(10000);
    });
  });

  describe("getDebt", () => {
    it("sums absolute values of negative entities", () => {
      const account = createAccount("account1", "Savings", 10000, baseDay);
      const debt = createAccount("debt1", "Loan", -5000, baseDay);
      const fallback = new FallbackEntity();

      const sim = new Simulation([fallback, account, debt], 1, baseDay);

      expect(sim.getDebt(baseDay)).toBe(5000);
    });
  });

  describe("getNetWorth", () => {
    it("calculates assets minus debt correctly", () => {
      const account = createAccount("account1", "Savings", 10000, baseDay);
      const debt = createAccount("debt1", "Mortgage", -250000, baseDay);
      const fallback = new FallbackEntity();

      const sim = new Simulation([fallback, account, debt], 1, baseDay);

      expect(sim.getNetWorth(baseDay)).toBe(10000 - 250000);
    });

    it("handles multiple assets and debts", () => {
      const checking = createAccount("checking", "Checking", 5000, baseDay);
      const savings = createAccount("savings", "Savings", 20000, baseDay);
      const mortgage = createAccount("mortgage", "Mortgage", -300000, baseDay);
      const carLoan = createAccount("car", "Car Loan", -15000, baseDay);
      const fallback = new FallbackEntity();

      const sim = new Simulation([fallback, checking, savings, mortgage, carLoan], 1, baseDay);

      // Assets: 5000 + 20000 = 25000
      // Debt: 300000 + 15000 = 315000
      // Net: 25000 - 315000 = -290000
      expect(sim.getNetWorth(baseDay)).toBe(-290000);
    });
  });

  describe("simulation range", () => {
    it("uses earliest ledger day as start", () => {
      const earlyAccount = createAccount("early", "Early", 1000, baseDay - 100);
      const lateAccount = createAccount("late", "Late", 2000, baseDay);
      const fallback = new FallbackEntity();

      const sim = new Simulation([fallback, earlyAccount, lateAccount], 1, baseDay);

      expect(sim.startDay).toBe(baseDay - 100);
    });

    it("extends by simulation years from start", () => {
      const account = createAccount("account", "Account", 1000, baseDay);
      const fallback = new FallbackEntity();

      const sim = new Simulation(
        [fallback, account],
        5, // 5 years
        baseDay,
      );

      expect(sim.endDay).toBe(baseDay + 5 * 365);
    });
  });

  describe("getEntityValueForDay", () => {
    it("returns last snapshot value at or before the requested day", () => {
      const account = new AccountEntity({
        id: "account",
        name: "Account",
        templateKey: "savings",
        growthRate: 0,
        ledger: [
          { day: baseDay, amount: 1000 },
          { day: baseDay + 30, amount: 1500 },
        ],
      });
      const fallback = new FallbackEntity();

      const sim = new Simulation([fallback, account], 1, baseDay);

      // Day 15 should return day 0's value (1000)
      expect(sim.getEntityValueForDay("account", baseDay + 15)).toBe(1000);
      // Day 35 should return day 30's value (1500)
      expect(sim.getEntityValueForDay("account", baseDay + 35)).toBe(1500);
    });

    it("returns 0 for unknown entity", () => {
      const fallback = new FallbackEntity();

      const sim = new Simulation([fallback], 1, baseDay);

      expect(sim.getEntityValueForDay("nonexistent", baseDay)).toBe(0);
    });

    it("returns 0 for day before any snapshots exist", () => {
      const account = createAccount("account", "Account", 1000, baseDay + 100);
      const fallback = new FallbackEntity();

      const sim = new Simulation([fallback, account], 1, baseDay);

      expect(sim.getEntityValueForDay("account", baseDay)).toBe(0);
    });
  });

  describe("empty plan handling", () => {
    it("handles plan with only fallback entity", () => {
      const fallback = new FallbackEntity();

      const sim = new Simulation([fallback], 1, baseDay);

      expect(sim.getAssets(baseDay)).toBe(0);
      expect(sim.getDebt(baseDay)).toBe(0);
      expect(sim.getNetWorth(baseDay)).toBe(0);
    });
  });

  describe("transaction fallback behavior", () => {
    it("redirects transaction to fallback when target entity is missing", () => {
      const fallback = new FallbackEntity();
      const incomeDay = createEpochDay(2024, 1, 15);

      // Income targeting non-existent entity "missing-account"
      const income = new IncomeEntity({
        id: "income",
        name: "Salary",
        templateKey: "salary",
        growthRate: 0,
        targetEntityId: "missing-account", // This entity doesn't exist
        schedule: Schedule.fromSerialized({
          type: ScheduleType.Monthly,
          daysOfMonth: [15],
          startDate: "2024-01-01",
        }),
        ledger: [{ day: baseDay, amount: 5000 }],
      });

      const sim = new Simulation([fallback, income], 1, baseDay);

      // Income should redirect to fallback entity
      expect(sim.getEntityValueForDay(fallback.id, incomeDay)).toBe(5000);
      expect(sim.getEntityValueForDay("missing-account", incomeDay)).toBe(0);
    });
  });
});
