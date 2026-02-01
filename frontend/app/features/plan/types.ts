import type { SerializedEntity } from "@/features/entity/types";

export interface SerializedPlanSummary {
  id: string;
  name: string;
  birthDate: string;
  retirementAge: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface SerializedPlan extends SerializedPlanSummary {
  entities: SerializedEntity[];
}
