import { monthYearToDateString } from '@/lib/date-utils';
import type { SerializedPlanSummary } from '../types';
import { usePlanApi } from './use-plan-api';

interface FormData {
  name: string;
  birthMonth: number;
  birthYear: number;
  retirementAge: number;
}

export function usePlanForm() {
  const planApi = usePlanApi();
  const isSubmitting = ref(false);

  async function createPlan(formData: FormData, useExample: boolean): Promise<SerializedPlanSummary> {
    isSubmitting.value = true;
    try {
      const birthDate = monthYearToDateString(formData.birthMonth, formData.birthYear);
      return await planApi.createPlan(
        {
          name: formData.name,
          birthDate,
          retirementAge: formData.retirementAge,
        },
        useExample,
      );
    } finally {
      isSubmitting.value = false;
    }
  }

  async function updatePlan(planId: string, formData: FormData): Promise<SerializedPlanSummary> {
    isSubmitting.value = true;
    try {
      const birthDate = monthYearToDateString(formData.birthMonth, formData.birthYear);
      return await planApi.updatePlan(planId, {
        name: formData.name,
        birthDate,
        retirementAge: formData.retirementAge,
      });
    } finally {
      isSubmitting.value = false;
    }
  }

  return {
    isSubmitting,
    createPlan,
    updatePlan,
  };
}
