<script setup lang="ts">
import { X } from "lucide-vue-next";
import {
  MONTHS,
  BIRTH_YEARS,
  DEFAULT_BIRTH_MONTH,
  DEFAULT_BIRTH_YEAR,
  DEFAULT_RETIREMENT_AGE,
} from "@/constants";
import { birthDateStringToMonthYear } from "@/lib/date-utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { SerializedPlanSummary } from "../types";
import { usePlanForm } from "../composables/use-plan-form";

const props = defineProps<{
  initialData?: SerializedPlanSummary;
  open: boolean;
  planId?: string;
  submitLabel: string;
  title: string;
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
      name: "",
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
const useExampleData = ref(true);

const isDisabled = computed(() => {
  return !formData.value.name.trim() || isSubmitting.value;
});

async function handleSubmit() {
  try {
    const planSummary: SerializedPlanSummary = props.planId
      ? await updatePlan(props.planId, formData.value)
      : await createPlan(formData.value, useExampleData.value);
    emit("success", planSummary);
  } catch (error) {
    console.error("Failed to save plan", error);
  }
}

function handleClose() {
  emit("close");
}
</script>

<template>
  <div v-if="open" class="fixed inset-0 z-50 flex items-center justify-center">
    <!-- Backdrop -->
    <div class="bg-background/80 absolute inset-0 backdrop-blur-sm" @click="handleClose" />

    <!-- Modal -->
    <div
      class="bg-background relative m-4 max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg border shadow-lg"
    >
      <!-- Header -->
      <header class="bg-background sticky top-0 flex items-center justify-between border-b p-4">
        <h2 class="text-lg font-semibold">{{ title }}</h2>

        <Button size="icon" variant="ghost" @click="handleClose">
          <span class="sr-only">Close</span>
          <X />
        </Button>
      </header>

      <!-- Form -->
      <div class="p-4">
        <form class="space-y-6" @submit.prevent="handleSubmit">
          <div class="space-y-2">
            <Label for="name">Plan Name</Label>
            <Input id="name" v-model="formData.name" required />
          </div>

          <div class="space-y-4">
            <div>
              <Label class="font-medium">Birth Date</Label>
              <div class="text-muted-foreground mt-1 text-sm">
                Used to calculate your current age and retirement timeline
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-2">
                <Label for="birthMonth">Month</Label>
                <select
                  id="birthMonth"
                  v-model.number="formData.birthMonth"
                  class="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
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
                  id="birthYear"
                  v-model.number="formData.birthYear"
                  class="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
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
              v-model.number="formData.retirementAge"
              max="120"
              min="10"
              type="number"
            />
            <div class="text-muted-foreground text-sm">Your planned retirement age</div>
          </div>

          <div v-if="isCreating" class="flex items-center gap-2">
            <Checkbox
              id="useExample"
              :default-value="true"
              @update:checked="(val: boolean) => (useExampleData = val)"
            />
            <Label for="useExample" class="text-muted-foreground cursor-pointer text-sm">
              Populate with demo data
            </Label>
          </div>

          <div class="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" @click="handleClose"> Cancel </Button>
            <Button type="submit" :disabled="isDisabled">
              {{ submitLabel }}
            </Button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
