import type { Entity } from "./entity";
import { AccountEntity } from "./entity-types/account-entity";
import { DebtEntity } from "./entity-types/debt-entity";
import { ExpenseEntity } from "./entity-types/expense-entity";
import { HoldingEntity } from "./entity-types/holding-entity";
import { IncomeEntity } from "./entity-types/income-entity";
import { PossessionEntity } from "./entity-types/possession-entity";
import { getTodayDateString, epochDayToDateString, formatDateString } from "@/lib/date-utils";
import {
  type EntityFormData,
  type ScheduleFormData,
  type LedgerEntryFormData,
  EntityType,
} from "./types";

/**
 * Convert Schedule class to ScheduleFormData.
 */
function scheduleToFormData(schedule: DebtEntity["paymentSchedule"]): ScheduleFormData {
  return {
    type: schedule.type,
    daysOfMonth: schedule.daysOfMonth,
    daysOfWeek: schedule.daysOfWeek,
    interval: schedule.interval,
    startDate: formatDateString(schedule.startDate),
    endDate: schedule.endDate ? formatDateString(schedule.endDate) : undefined,
  };
}

/**
 * Get default form data for a new entity of the given type.
 */
export function getDefaultFormData(type: EntityType): EntityFormData {
  const todayString = getTodayDateString();

  const baseData = {
    id: undefined,
    name: "",
    templateKey: "",
    parentId: undefined,
    ledgerEntries: [
      {
        day: todayString,
        amount: 0,
      },
    ],
  };

  const defaultSchedule: ScheduleFormData = {
    type: "monthly",
    daysOfMonth: [1],
    startDate: todayString,
  };

  switch (type) {
    case EntityType.Account:
      return {
        ...baseData,
        type: EntityType.Account,
        growthRate: 0,
      };

    case EntityType.Debt:
      return {
        ...baseData,
        type: EntityType.Debt,
        interestRate: 0,
        paymentAmount: 0,
        paymentSchedule: defaultSchedule,
        paymentSourceEntityId: "",
      };

    case EntityType.Expense:
      return {
        ...baseData,
        type: EntityType.Expense,
        growthRate: 0,
        schedule: defaultSchedule,
        sourceEntityId: "",
      };

    case EntityType.Holding:
      return {
        ...baseData,
        type: EntityType.Holding,
        symbol: "",
        growthRate: 0,
        ledgerEntries: [
          {
            day: todayString,
            shareQuantity: 0,
            sharePrice: 0,
          },
        ],
      };

    case EntityType.Income:
      return {
        ...baseData,
        type: EntityType.Income,
        growthRate: 0,
        schedule: defaultSchedule,
        targetEntityId: "",
      };

    case EntityType.Possession:
      return {
        ...baseData,
        type: EntityType.Possession,
        growthRate: 0,
      };
  }
}

/**
 * Convert an Entity instance to form data.
 */
export function entityToFormData(entity: Entity): EntityFormData {
  const ledgerEntries: LedgerEntryFormData[] = entity.ledger.map((entry) => ({
    id: entry.id,
    day: epochDayToDateString(entry.day),
    amount: entry.amount,
    shareQuantity: entry.shareQuantity,
    sharePrice: entry.sharePrice,
  }));

  // Ensure at least one ledger entry
  if (ledgerEntries.length === 0) {
    ledgerEntries.push({
      day: getTodayDateString(),
      amount: 0,
    });
  }

  const baseData = {
    id: entity.id,
    name: entity.name,
    templateKey: entity.templateKey,
    parentId: entity.parentId,
    ledgerEntries,
  };

  // Type-specific conversion using instanceof
  if (entity instanceof AccountEntity) {
    return {
      ...baseData,
      type: EntityType.Account,
      growthRate: entity.growthRate,
    };
  }

  if (entity instanceof DebtEntity) {
    return {
      ...baseData,
      type: EntityType.Debt,
      interestRate: entity.interestRate,
      paymentAmount: entity.paymentAmount,
      paymentSchedule: scheduleToFormData(entity.paymentSchedule),
      paymentSourceEntityId: entity.paymentSourceEntityId,
    };
  }

  if (entity instanceof ExpenseEntity) {
    return {
      ...baseData,
      type: EntityType.Expense,
      growthRate: entity.growthRate,
      schedule: scheduleToFormData(entity.schedule),
      sourceEntityId: entity.sourceEntityId,
    };
  }

  if (entity instanceof HoldingEntity) {
    return {
      ...baseData,
      type: EntityType.Holding,
      symbol: entity.symbol,
      growthRate: entity.growthRate,
    };
  }

  if (entity instanceof IncomeEntity) {
    return {
      ...baseData,
      type: EntityType.Income,
      growthRate: entity.growthRate,
      schedule: scheduleToFormData(entity.schedule),
      targetEntityId: entity.targetEntityId,
    };
  }

  if (entity instanceof PossessionEntity) {
    return {
      ...baseData,
      type: EntityType.Possession,
      growthRate: entity.growthRate,
    };
  }

  return {
    ...baseData,
    type: EntityType.Account,
    growthRate: 0,
  };
}
