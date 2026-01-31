import type { SerializedPlan, SerializedPlanSummary } from "../types";

interface PlanData {
  name: string;
  birthDate: string; // YYYY-MM-DD
  retirementAge: number;
}

export function usePlanApi() {
  const { get, post, put, del } = useApi();

  /**
   * Fetch all plan summaries (no entities).
   */
  async function fetchPlanSummaries(): Promise<SerializedPlanSummary[]> {
    return await get<SerializedPlanSummary[]>("/plans");
  }

  /**
   * Fetch a single plan with all related entities.
   */
  async function fetchPlan(planId: string): Promise<SerializedPlan> {
    return await get<SerializedPlan>(`/plans/${planId}`);
  }

  /**
   * Create a new plan, and get the summary for it.
   */
  async function createPlan(data: PlanData, useExample: boolean): Promise<SerializedPlanSummary> {
    return await post<SerializedPlanSummary>("/plans", {
      plan: data,
      use_example: useExample,
    });
  }

  /**
   * Update an existing plan, and get the summary for it.
   */
  async function updatePlan(planId: string, data: PlanData): Promise<SerializedPlanSummary> {
    return await put<SerializedPlanSummary>(`/plans/${planId}`, { plan: data });
  }

  /**
   * Delete a plan.
   */
  async function deletePlan(planId: string): Promise<void> {
    return await del(`/plans/${planId}`);
  }

  return {
    fetchPlanSummaries,
    fetchPlan,
    createPlan,
    updatePlan,
    deletePlan,
  };
}
