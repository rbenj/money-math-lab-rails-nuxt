<script setup lang="ts">
import { Loader2 } from "lucide-vue-next";
import {
  MONTHS,
  BIRTH_YEARS,
  DEFAULT_BIRTH_MONTH,
  DEFAULT_BIRTH_YEAR,
  DEFAULT_RETIREMENT_AGE,
  SLOW_LOADING_DELAY,
} from "@/constants";
import { birthDateStringToMonthYear } from "@/lib/date-utils";
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
const errorMessage = ref<string | null>(null);

const showSpinner = ref(false);
let spinnerTimeout: ReturnType<typeof setTimeout> | undefined;

watch(isSubmitting, (submitting) => {
  if (submitting) {
    spinnerTimeout = setTimeout(() => {
      showSpinner.value = true;
    }, SLOW_LOADING_DELAY);
  } else {
    clearTimeout(spinnerTimeout);
    showSpinner.value = false;
  }
});

onUnmounted(() => {
  clearTimeout(spinnerTimeout);
});

const isDisabled = computed(() => {
  return !formData.value.name.trim() || isSubmitting.value;
});

async function handleSubmit() {
  errorMessage.value = null;
  try {
    const planSummary: SerializedPlanSummary = props.planId
      ? await updatePlan(props.planId, formData.value)
      : await createPlan(formData.value, useExampleData.value);
    emit("success", planSummary);
  } catch (e) {
    errorMessage.value = "Failed to save plan. Please try again.";
    console.error("Failed to save plan", e);
  }
}

function handleClose() {
  emit("close");
}
</script>

<template>
  <Dialog :open="open" @update:open="(val) => !val && handleClose()">
    <DialogScrollContent class="max-w-md">
      <DialogHeader>
        <DialogTitle>{{ title }}</DialogTitle>

        <DialogDescription class="sr-only">
          {{ isCreating ? "Create a new financial plan" : "Edit your plan settings" }}
        </DialogDescription>
      </DialogHeader>

      <form
        class="space-y-6 transition-opacity"
        :class="{ 'pointer-events-none opacity-50': isSubmitting }"
        @submit.prevent="handleSubmit"
      >
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
              <Select
                :model-value="String(formData.birthMonth)"
                @update:model-value="formData.birthMonth = Number($event)"
              >
                <SelectTrigger id="birthMonth" class="w-full">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    v-for="month in MONTHS"
                    :key="month.value"
                    :value="String(month.value)"
                  >
                    {{ month.label }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div class="space-y-2">
              <Label for="birthYear">Year</Label>
              <Select
                :model-value="String(formData.birthYear)"
                @update:model-value="formData.birthYear = Number($event)"
              >
                <SelectTrigger id="birthYear" class="w-full">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="year in BIRTH_YEARS" :key="year" :value="String(year)">
                    {{ year }}
                  </SelectItem>
                </SelectContent>
              </Select>
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

        <div v-if="errorMessage" class="text-destructive text-sm" role="alert">
          {{ errorMessage }}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" :disabled="isSubmitting" @click="handleClose">
            Cancel
          </Button>
          <Button type="submit" :disabled="isDisabled">
            <Loader2 v-if="showSpinner" class="mr-2 animate-spin" />
            {{ submitLabel }}
          </Button>
        </DialogFooter>
      </form>
    </DialogScrollContent>
  </Dialog>
</template>
