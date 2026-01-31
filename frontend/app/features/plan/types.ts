import type { SerializedEntity } from '@/features/entity/types';

/**
 * Serialized summary of a Plan, pretty much a plan without entities.
 */
export interface SerializedPlanSummary {
  id: string;
  name: string;
  birthDate: string;
  retirementAge: number;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Serialized version of Plan.
 */
export interface SerializedPlan extends SerializedPlanSummary {
  entities: SerializedEntity[];
}
