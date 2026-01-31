<script setup lang="ts">
import { Trash2 } from "lucide-vue-next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EntityType, type LedgerEntryFormData } from "../types";

const props = defineProps<{
  entityType: EntityType;
  modelValue: LedgerEntryFormData[];
}>();

const emit = defineEmits<{
  "update:modelValue": [entries: LedgerEntryFormData[]];
}>();

const isHolding = computed(() => props.entityType === EntityType.Holding);

function handleEntryChange(
  index: number,
  field: keyof LedgerEntryFormData,
  value: string | number | undefined,
) {
  const newEntries = [...props.modelValue];
  const existing = newEntries[index];
  if (existing) {
    newEntries[index] = { ...existing, [field]: value };
    emit("update:modelValue", newEntries);
  }
}

function handleAddEntry() {
  const today = new Date();
  const year = today.getUTCFullYear();
  const month = String(today.getUTCMonth() + 1).padStart(2, "0");
  const day = String(today.getUTCDate()).padStart(2, "0");

  const newEntry: LedgerEntryFormData = isHolding.value
    ? { day: `${year}-${month}-${day}`, shareQuantity: 0, sharePrice: 0 }
    : { day: `${year}-${month}-${day}`, amount: 0 };

  emit("update:modelValue", [...props.modelValue, newEntry]);
}

function handleRemoveEntry(index: number) {
  if (props.modelValue.length <= 1) return;

  const entry = props.modelValue[index];
  if (!entry) return;

  if (entry.id) {
    // Mark for deletion instead of removing
    const newEntries = [...props.modelValue];
    newEntries[index] = { ...entry, isDeleted: true };
    emit("update:modelValue", newEntries);
  } else {
    // Remove new entries directly
    const newEntries = props.modelValue.filter((_, i) => i !== index);
    emit("update:modelValue", newEntries);
  }
}

// Filter out entries marked for deletion for display
const displayEntries = computed(() =>
  props.modelValue
    .map((entry, index) => ({ entry, index }))
    .filter(({ entry }) => !entry.isDeleted),
);
</script>

<template>
  <div class="space-y-3">
    <div class="flex items-center justify-between">
      <Label class="font-medium">Ledger Entries</Label>
      <Button size="sm" type="button" variant="outline" @click="handleAddEntry"> Add Entry </Button>
    </div>

    <div class="space-y-2">
      <div
        v-for="{ entry, index } in displayEntries"
        :key="index"
        class="flex items-end gap-2 rounded-md border p-2"
      >
        <div class="flex-1 space-y-1">
          <Label :for="`entry-${index}-day`" class="text-xs">Date</Label>
          <Input
            :id="`entry-${index}-day`"
            type="date"
            :model-value="entry.day"
            @update:model-value="handleEntryChange(index, 'day', $event as string)"
          />
        </div>

        <template v-if="isHolding">
          <div class="flex-1 space-y-1">
            <Label :for="`entry-${index}-quantity`" class="text-xs">Shares</Label>
            <Input
              :id="`entry-${index}-quantity`"
              type="number"
              step="0.0001"
              :model-value="String(entry.shareQuantity ?? '')"
              @update:model-value="
                handleEntryChange(
                  index,
                  'shareQuantity',
                  $event ? parseFloat($event as string) : undefined,
                )
              "
            />
          </div>
          <div class="flex-1 space-y-1">
            <Label :for="`entry-${index}-price`" class="text-xs">Price</Label>
            <Input
              :id="`entry-${index}-price`"
              type="number"
              step="0.01"
              :model-value="String(entry.sharePrice ?? '')"
              @update:model-value="
                handleEntryChange(
                  index,
                  'sharePrice',
                  $event ? parseFloat($event as string) : undefined,
                )
              "
            />
          </div>
        </template>

        <template v-else>
          <div class="flex-1 space-y-1">
            <Label :for="`entry-${index}-amount`" class="text-xs">Amount</Label>
            <Input
              :id="`entry-${index}-amount`"
              type="number"
              step="0.01"
              :model-value="String(entry.amount ?? '')"
              @update:model-value="
                handleEntryChange(
                  index,
                  'amount',
                  $event ? parseFloat($event as string) : undefined,
                )
              "
            />
          </div>
        </template>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          :disabled="displayEntries.length <= 1"
          @click="handleRemoveEntry(index)"
        >
          <Trash2 />
        </Button>
      </div>
    </div>
  </div>
</template>
