import { dateToEpochDay } from "@/lib/date-utils";
import type { Entity } from "@/features/entity/entity";
import { deserializeEntities } from "@/features/entity/serialization";
import { ExpenseEntity } from "@/features/entity/entity-types/expense-entity";
import { FallbackEntity } from "@/features/entity/entity-types/fallback-entity";
import { IncomeEntity } from "@/features/entity/entity-types/income-entity";
import { Simulation, type DataPointsByDay } from "@/features/simulation/simulation";
import type { SerializedPlan, SerializedPlanSummary } from "./types";

export const YEARS_PAST_RETIREMENT = 15;

export interface PlanInput {
  id: string;
  name: string;
  birthDate: string; // YYYY-MM-DD
  retirementAge: number;
  entities?: Entity[];
}

/**
 * Scenario information and a collection of financial entities that can be simulated.
 */
export class Plan {
  public readonly id: string;
  public readonly name: string;
  public readonly birthDate: string; // YYYY-MM-DD
  public readonly retirementAge: number;
  public readonly entities: Entity[];

  private todayDay: number;
  private simulation?: Simulation;

  /**
   * Create a Plan from serialized plan data.
   */
  public static fromSerialized(data: SerializedPlan): Plan {
    return new Plan({
      id: data.id,
      name: data.name,
      birthDate: data.birthDate,
      retirementAge: data.retirementAge,
      entities: deserializeEntities(data.entities),
    });
  }

  public constructor(input: PlanInput) {
    this.id = input.id;
    this.name = input.name;
    this.birthDate = input.birthDate;
    this.retirementAge = input.retirementAge;
    this.entities = input.entities ?? [];

    this.todayDay = dateToEpochDay(new Date());
  }

  /**
   * Convert to serialized plan summary data.
   */
  public toSerialized(): SerializedPlanSummary {
    return {
      id: this.id,
      name: this.name,
      birthDate: this.birthDate,
      retirementAge: this.retirementAge,
    };
  }

  /**
   * Run simulation to enable access to simulation data, chainable.
   */
  public simulate(): this {
    if (this.simulation) {
      return this;
    }

    // Add fallback entity and run simulation
    const entities = [new FallbackEntity(), ...this.entities];

    const birthYear = new Date(this.birthDate).getUTCFullYear();
    const currentYear = new Date().getFullYear();
    const currentAge = currentYear - birthYear;
    const targetAge = this.retirementAge + YEARS_PAST_RETIREMENT;
    const projectionYears = Math.max(1, targetAge - currentAge);

    this.simulation = new Simulation(entities, projectionYears);

    return this;
  }

  /**
   * Make a new Plan with filtered entities.
   */
  public filter(activeEntities: Entity[]): Plan {
    return new Plan({
      id: this.id,
      name: this.name,
      birthDate: this.birthDate,
      retirementAge: this.retirementAge,
      entities: this.entities.filter((entity) => activeEntities.includes(entity)),
    });
  }

  /**
   * Create a copy with updated metadata.
   */
  public withUpdates(
    updates: Partial<Pick<PlanInput, "name" | "birthDate" | "retirementAge">>,
  ): Plan {
    return new Plan({
      id: this.id,
      name: updates.name ?? this.name,
      birthDate: updates.birthDate ?? this.birthDate,
      retirementAge: updates.retirementAge ?? this.retirementAge,
      entities: this.entities,
    });
  }

  /**
   * Get the start day of the simulation.
   */
  public getSimulationStartDay(): number {
    return this.simulation?.startDay ?? 0;
  }

  /**
   * Get the end day of the simulation.
   */
  public getSimulationEndDay(): number {
    return this.simulation?.endDay ?? 0;
  }

  /**
   * Get data points for all years in the simulation.
   */
  public getDataPointsForAllYears(): DataPointsByDay {
    return this.simulation?.getDataPointsForAllYears() ?? new Map();
  }

  /**
   * Get the normalized retirement day based on birth date and retirement age.
   */
  public getRetirementDay(): number {
    const birth = new Date(this.birthDate);
    const retirementYear = birth.getUTCFullYear() + this.retirementAge;
    const retirementDate = new Date(
      Date.UTC(retirementYear, birth.getUTCMonth(), birth.getUTCDate()),
    );
    return dateToEpochDay(retirementDate);
  }

  /**
   * Get sum of all positive balances for today.
   */
  public getAssetsForToday(): number {
    return this.simulation?.getAssets(this.todayDay) ?? 0;
  }

  /**
   * Get sum of all positive balances for one year ago.
   */
  public getAssetsForLastYear(): number {
    const lastYearDay = this.todayDay - 365;
    return this.simulation?.getAssets(lastYearDay) ?? 0;
  }

  /**
   * Get sum of all negative balances for today.
   */
  public getDebtForToday(): number {
    return this.simulation?.getDebt(this.todayDay) ?? 0;
  }

  /**
   * Get sum of all negative balances for one year ago.
   */
  public getDebtForLastYear(): number {
    const lastYearDay = this.todayDay - 365;
    return this.simulation?.getDebt(lastYearDay) ?? 0;
  }

  /**
   * Get total net worth for today.
   */
  public getNetWorthForToday(): number {
    return this.simulation?.getNetWorth(this.todayDay) ?? 0;
  }

  /**
   * Get total net worth for one year ago.
   */
  public getNetWorthForLastYear(): number {
    const lastYearDay = this.todayDay - 365;
    return this.simulation?.getNetWorth(lastYearDay) ?? 0;
  }

  /**
   * Get the value of an entity for today.
   */
  public getEntityValue(entity: Entity): number {
    return this.simulation?.getEntityValueForDay(entity.id, this.todayDay) ?? 0;
  }

  /**
   * Get the designated display value for an entity.
   */
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
