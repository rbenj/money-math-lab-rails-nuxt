import { calculateAge, createEpochDay, getTodayEpochDay, parseDateString } from "@/lib/date-utils";
import type { Entity } from "@/features/entity/entity";
import { deserializeEntities } from "@/features/entity/serialization";
import { ExpenseEntity } from "@/features/entity/entity-types/expense-entity";
import { FallbackEntity } from "@/features/entity/entity-types/fallback-entity";
import { IncomeEntity } from "@/features/entity/entity-types/income-entity";
import { Simulation, type DataPointsByDay } from "@/features/simulation/simulation";
import type { SerializedPlan, SerializedPlanSummary } from "./types";

export const YEARS_PAST_RETIREMENT = 15;
export const MAX_PROJECTION_AGE = 120;
export const TARGET_PROJECTION_YEARS = 50;

export interface PlanInput {
  id: string;
  name: string;
  birthDate: string; // YYYY-MM-DD
  retirementAge: number;
  entities?: Entity[];
  todayEpochDay?: number; // Deterministic epoch day for today
}

export class Plan {
  public readonly id: string;
  public readonly name: string;
  public readonly birthDate: string; // YYYY-MM-DD
  public readonly retirementAge: number;
  public readonly entities: Entity[];

  private todayDay: number;
  private simulation?: Simulation;

  public static fromSerialized(data: SerializedPlan, todayEpochDay?: number): Plan {
    return new Plan({
      id: data.id,
      name: data.name,
      birthDate: data.birthDate,
      retirementAge: data.retirementAge,
      entities: deserializeEntities(data.entities),
      todayEpochDay,
    });
  }

  public constructor(input: PlanInput) {
    this.id = input.id;
    this.name = input.name;
    this.birthDate = input.birthDate;
    this.retirementAge = input.retirementAge;
    this.entities = input.entities ?? [];
    this.todayDay = input.todayEpochDay ?? getTodayEpochDay();
  }

  public toSerialized(): SerializedPlanSummary {
    return {
      id: this.id,
      name: this.name,
      birthDate: this.birthDate,
      retirementAge: this.retirementAge,
    };
  }

  public simulate(): this {
    if (this.simulation) {
      return this;
    }

    // Add fallback entity and run simulation
    const entities = [new FallbackEntity(), ...this.entities];

    const currentAge = calculateAge(this.birthDate, this.todayDay);
    const minTargetAge = this.retirementAge + YEARS_PAST_RETIREMENT;
    const desiredTargetAge = currentAge + TARGET_PROJECTION_YEARS;
    const targetAge = Math.min(MAX_PROJECTION_AGE, Math.max(minTargetAge, desiredTargetAge));
    const projectionYears = Math.max(1, targetAge - currentAge);

    this.simulation = new Simulation(entities, projectionYears, this.todayDay);

    return this;
  }

  public filter(activeEntities: Entity[]): Plan {
    return new Plan({
      id: this.id,
      name: this.name,
      birthDate: this.birthDate,
      retirementAge: this.retirementAge,
      entities: this.entities.filter((entity) => activeEntities.includes(entity)),
      todayEpochDay: this.todayDay,
    });
  }

  public withUpdates(
    updates: Partial<Pick<PlanInput, "name" | "birthDate" | "retirementAge">>,
  ): Plan {
    return new Plan({
      id: this.id,
      name: updates.name ?? this.name,
      birthDate: updates.birthDate ?? this.birthDate,
      retirementAge: updates.retirementAge ?? this.retirementAge,
      entities: this.entities,
      todayEpochDay: this.todayDay,
    });
  }

  public getSimulationStartDay(): number {
    return this.simulation?.startDay ?? 0;
  }

  public getSimulationEndDay(): number {
    return this.simulation?.endDay ?? 0;
  }

  public getTodayEpochDay(): number {
    return this.todayDay;
  }

  public getDataPointsForAllYears(): DataPointsByDay {
    return this.simulation?.getDataPointsForAllYears() ?? new Map();
  }

  public getRetirementDay(): number {
    const { year, month, day } = parseDateString(this.birthDate);
    return createEpochDay(year + this.retirementAge, month, day);
  }

  public getAssetsForToday(): number {
    return this.simulation?.getAssets(this.todayDay) ?? 0;
  }

  public getAssetsForLastYear(): number {
    const lastYearDay = this.todayDay - 365;
    return this.simulation?.getAssets(lastYearDay) ?? 0;
  }

  public getDebtForToday(): number {
    return this.simulation?.getDebt(this.todayDay) ?? 0;
  }

  public getDebtForLastYear(): number {
    const lastYearDay = this.todayDay - 365;
    return this.simulation?.getDebt(lastYearDay) ?? 0;
  }

  public getNetWorthForToday(): number {
    return this.simulation?.getNetWorth(this.todayDay) ?? 0;
  }

  public getNetWorthForLastYear(): number {
    const lastYearDay = this.todayDay - 365;
    return this.simulation?.getNetWorth(lastYearDay) ?? 0;
  }

  public getEntityValue(entity: Entity): number {
    return this.simulation?.getEntityValueForDay(entity.id, this.todayDay) ?? 0;
  }

  public getEntityDisplayValue(entityId: string): number {
    const entity = this.entities.find((e) => e.id === entityId);
    if (!entity) return 0;

    if (entity instanceof IncomeEntity || entity instanceof ExpenseEntity) {
      const lastEntry = entity.ledger[entity.ledger.length - 1];
      return lastEntry?.amount ?? 0;
    }

    return this.getEntityValue(entity);
  }
}
