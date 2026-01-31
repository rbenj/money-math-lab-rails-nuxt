<script setup lang="ts">
import { ScheduleType } from "@/lib/schedule";
import type { ScheduleFormData } from "../types";

const SCHEDULE_TYPES = Object.entries(ScheduleType).map(([label, value]) => ({
  value: value as ScheduleType,
  label,
}));

const props = defineProps<{
  label: string;
  modelValue: ScheduleFormData;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: ScheduleFormData];
}>();

function handleTypeChange(type: string) {
  const newValue: ScheduleFormData = {
    ...props.modelValue,
    type,
    daysOfMonth: type === "monthly" ? [1] : undefined,
    daysOfWeek: type === "weekly" ? [1] : undefined,
    interval: type === "custom" ? 1 : undefined,
  };
  emit("update:modelValue", newValue);
}

function handleDaysOfMonthChange(input: string) {
  const days = input
    .split(",")
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => !isNaN(n) && n >= 1 && n <= 31);

  emit("update:modelValue", {
    ...props.modelValue,
    daysOfMonth: days.length > 0 ? days : undefined,
  });
}

function handleDaysOfWeekChange(input: string) {
  const days = input
    .split(",")
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => !isNaN(n) && n >= 0 && n <= 6);

  emit("update:modelValue", {
    ...props.modelValue,
    daysOfWeek: days.length > 0 ? days : undefined,
  });
}

function update(updates: Partial<ScheduleFormData>) {
  emit("update:modelValue", { ...props.modelValue, ...updates });
}
</script>

<template>
  <div class="space-y-3 rounded-md border p-3">
    <Label class="font-medium">{{ label }}</Label>

    <div class="grid grid-cols-2 gap-3">
      <div class="space-y-1">
        <Label for="schedule-type" class="text-xs">Type</Label>
        <Select
          :model-value="modelValue.type"
          @update:model-value="handleTypeChange(String($event))"
        >
          <SelectTrigger id="schedule-type" class="w-full" size="sm">
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="type in SCHEDULE_TYPES" :key="type.value" :value="type.value">
              {{ type.label }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div class="space-y-1">
        <Label for="schedule-start" class="text-xs">Start Date</Label>
        <Input
          id="schedule-start"
          type="date"
          :model-value="modelValue.startDate"
          @update:model-value="update({ startDate: $event as string })"
        />
      </div>
    </div>

    <div class="grid grid-cols-2 gap-3">
      <div class="space-y-1">
        <Label for="schedule-end" class="text-xs">End Date (optional)</Label>
        <Input
          id="schedule-end"
          type="date"
          :model-value="modelValue.endDate || ''"
          @update:model-value="update({ endDate: ($event as string) || undefined })"
        />
      </div>

      <div v-if="modelValue.type === 'monthly'" class="space-y-1">
        <Label for="days-of-month" class="text-xs">Days of Month (comma-separated)</Label>
        <Input
          id="days-of-month"
          placeholder="1, 15"
          :model-value="modelValue.daysOfMonth?.join(', ') || ''"
          @update:model-value="handleDaysOfMonthChange($event as string)"
        />
      </div>

      <div v-if="modelValue.type === 'weekly'" class="space-y-1">
        <Label for="days-of-week" class="text-xs">Days of Week (0=Sun, 6=Sat)</Label>
        <Input
          id="days-of-week"
          placeholder="1, 3, 5"
          :model-value="modelValue.daysOfWeek?.join(', ') || ''"
          @update:model-value="handleDaysOfWeekChange($event as string)"
        />
      </div>

      <div v-if="modelValue.type === 'custom'" class="space-y-1">
        <Label for="interval" class="text-xs">Interval (days)</Label>
        <Input
          id="interval"
          type="number"
          min="1"
          :model-value="String(modelValue.interval || 1)"
          @update:model-value="update({ interval: parseInt($event as string, 10) || 1 })"
        />
      </div>
    </div>
  </div>
</template>
