<script setup lang="ts">
import { X } from 'lucide-vue-next';
import {
  MONTHS,
  BIRTH_YEARS,
  DEFAULT_BIRTH_MONTH,
  DEFAULT_BIRTH_YEAR,
  DEFAULT_RETIREMENT_AGE,
} from '@/constants';
import { birthDateStringToMonthYear } from '@/lib/date-utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { SerializedPlanSummary } from '../types';
import { usePlanForm } from '../composables/use-plan-form';

const props = defineProps<{
  initialData?: SerializedPlanSummary
  open: boolean
  planId?: string
  submitLabel: string
  title: string
}>();

const emit = defineEmits<{
  close: [];
  success: [planSummary: SerializedPlanSummary];
}>();

const { isSubmitting, createPlan, updatePlan } = usePlanForm();

const isCreating = computed(() => !props.planId);

function getInitialFormValues() {
  if (!props.initialData) {
    return {
      name: '',
      birthMonth: DEFAULT_BIRTH_MONTH,
      birthYear: DEFAULT_BIRTH_YEAR,
      retirementAge: DEFAULT_RETIREMENT_AGE,
    };
  }
  const { month, year } = birthDateStringToMonthYear(props.initialData.birthDate);
  return {
    name: props.initialData.name,
    birthMonth: month,
    birthYear: year,
    retirementAge: props.initialData.retirementAge,
  };
}

const formData = ref(getInitialFormValues());
const useExampleData = ref(false);

const isDisabled = computed(() => {
  return !formData.value.name.trim() || isSubmitting.value;
});

async function handleSubmit() {
  try {
    const planSummary: SerializedPlanSummary = props.planId
      ? await updatePlan(props.planId, formData.value)
      : await createPlan(formData.value, useExampleData.value);
    emit('success', planSummary);
  } catch (error) {
    console.error('Failed to save plan', error);
  }
}

function handleClose() {
  emit('close');
}
</script>

<template>
  <div v-if="open" class="fixed inset-0 z-50 flex items-center justify-center">
    <!-- Backdrop -->
    <div
      class="absolute inset-0 bg-background/80 backdrop-blur-sm"
      @click="handleClose"
    />

    <!-- Modal -->
    <div class="relative overflow-y-auto w-full max-w-md max-h-[90vh] m-4 border rounded-lg shadow-lg bg-background">
      <!-- Header -->
      <header class="sticky top-0 flex items-center justify-between p-4 border-b bg-background">
        <h2 class="text-lg font-semibold">{{ title }}</h2>

        <Button
          size="icon"
          variant="ghost"
          @click="handleClose"
        >
          <span class="sr-only">Close</span>
          <X />
        </Button>
      </header>

      <!-- Form -->
      <div class="p-4">
        <form class="space-y-6" @submit.prevent="handleSubmit">
          <div class="space-y-2">
            <Label for="name">Plan Name</Label>
            <Input
              id="name"
              required
              v-model="formData.name"
            />
          </div>

          <div class="space-y-4">
            <div>
              <Label class="font-medium">Birth Date</Label>
              <div class="mt-1 text-sm text-muted-foreground">
                Used to calculate your current age and retirement timeline
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-2">
                <Label for="birthMonth">Month</Label>
                <select
                  class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  id="birthMonth"
                  v-model.number="formData.birthMonth"
                >
                  <option value="">Select</option>
                  <option v-for="month in MONTHS" :key="month.value" :value="month.value">
                    {{ month.label }}
                  </option>
                </select>
              </div>

              <div class="space-y-2">
                <Label for="birthYear">Year</Label>
                <select
                  class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  id="birthYear"
                  v-model.number="formData.birthYear"
                >
                  <option value="">Select</option>
                  <option v-for="year in BIRTH_YEARS" :key="year" :value="year">
                    {{ year }}
                  </option>
                </select>
              </div>
            </div>
          </div>

          <div class="space-y-2">
            <Label for="retirementAge">Retirement Age</Label>
            <Input
              id="retirementAge"
              max="120"
              min="10"
              type="number"
              v-model.number="formData.retirementAge"
            />
            <div class="text-sm text-muted-foreground">
              Your planned retirement age
            </div>
          </div>

          <div v-if="isCreating" class="flex items-center gap-2 p-3 border rounded-md bg-muted/50">
            <input
              id="useExample"
              type="checkbox"
              v-model="useExampleData"
              class="h-4 w-4 rounded border-input"
            />
            <Label for="useExample" class="cursor-pointer">
              <span class="font-medium">Start with example data</span>
              <span class="block text-sm text-muted-foreground">
                Populate with sample income, accounts, debts, and expenses
              </span>
            </Label>
          </div>

          <div class="flex justify-end gap-2 pt-4">
            <Button
              @click="handleClose"
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              :disabled="isDisabled"
            >
              {{ submitLabel }}
            </Button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
