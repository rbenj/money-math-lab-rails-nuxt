<script setup lang="ts">
import { X } from "lucide-vue-next";
import { type EntityFormData, type ScheduleFormData, EntityType } from "../types";
import type { Entity } from "../entity";
import { entityToFormData, getDefaultFormData } from "../form-helpers";
import { useEntityForm } from "../composables/use-entity-form";
import { getTemplatesForEntityType } from "../entity-templates";

const ENTITY_TYPES = Object.entries(EntityType).map(([label, value]) => ({
  value: value as EntityType,
  label,
}));

export interface ParentEntityData {
  id: string;
  name: string;
}

export interface AccountEntityData {
  id: string;
  name: string;
}

const props = withDefaults(
  defineProps<{
    open: boolean;
    title: string;
    planId: string;
    entityId?: string;
    initialEntity?: Entity;
    availableParents?: ParentEntityData[];
    availableAccounts?: AccountEntityData[];
  }>(),
  {
    availableParents: () => [],
    availableAccounts: () => [],
  },
);

const emit = defineEmits<{
  close: [];
  success: [entity: Entity];
}>();

const { isSubmitting, createEntity, updateEntity } = useEntityForm();

// Convert Entity to form data if editing, otherwise use defaults
const initialFormData = computed(() => {
  if (props.initialEntity) {
    return entityToFormData(props.initialEntity);
  }
  return getDefaultFormData(EntityType.Account);
});

const formData = ref<EntityFormData>(initialFormData.value);

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      formData.value = { ...initialFormData.value };
    }
  },
);

watch(
  () => props.initialEntity,
  () => {
    if (props.open) {
      formData.value = { ...initialFormData.value };
    }
  },
  { deep: true },
);

const isEditing = computed(() => !!props.entityId);

const availableTemplates = computed(() =>
  getTemplatesForEntityType(formData.value.type).map((t) => ({ key: t.key, name: t.name })),
);

function handleTypeChange(type: EntityType) {
  const newData = getDefaultFormData(type);
  const templates = availableTemplates.value;
  formData.value = {
    ...newData,
    id: formData.value.id,
    name: formData.value.name,
    templateKey: templates[0]?.key ?? "",
    parentId: formData.value.parentId,
  } as EntityFormData;
}

async function handleSubmit() {
  try {
    const entity = props.entityId
      ? await updateEntity(props.entityId, formData.value)
      : await createEntity(props.planId, formData.value);
    emit("success", entity);
  } catch (error) {
    console.error("Failed to save entity:", error);
  }
}

function handleClose() {
  emit("close");
}

function updateField<K extends keyof EntityFormData>(field: K, value: EntityFormData[K]) {
  (formData.value as Record<string, unknown>)[field] = value;
}

function updateGrowthRate(rate: number) {
  if ("growthRate" in formData.value) {
    formData.value.growthRate = rate;
  }
}

function updateSchedule(schedule: ScheduleFormData) {
  if (formData.value.type === EntityType.Expense || formData.value.type === EntityType.Income) {
    formData.value.schedule = schedule;
  }
}

const hasGrowthRate = computed(
  () =>
    formData.value.type === EntityType.Account ||
    formData.value.type === EntityType.Holding ||
    formData.value.type === EntityType.Possession ||
    formData.value.type === EntityType.Income ||
    formData.value.type === EntityType.Expense,
);

const growthRateValue = computed(() => {
  if ("growthRate" in formData.value) {
    return formData.value.growthRate;
  }
  return 0;
});
</script>

<template>
  <div v-if="open" class="fixed inset-0 z-50 flex items-center justify-center">
    <!-- Backdrop -->
    <div class="bg-background/80 absolute inset-0 backdrop-blur-sm" @click="handleClose" />

    <!-- Modal -->
    <div
      class="bg-background relative m-4 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg border shadow-lg"
    >
      <!-- Header -->
      <div class="bg-background sticky top-0 z-10 flex items-center justify-between border-b p-4">
        <h2 class="text-lg font-semibold">{{ title }}</h2>
        <Button size="icon" variant="ghost" @click="handleClose">
          <X />
          <span class="sr-only">Close</span>
        </Button>
      </div>

      <!-- Form -->
      <form class="space-y-4 p-4" @submit.prevent="handleSubmit">
        <!-- Entity Type -->
        <div v-if="!isEditing" class="space-y-2">
          <Label for="type">Type</Label>
          <select
            id="type"
            :value="formData.type"
            class="border-input bg-background h-9 w-full rounded-md border px-3 py-1 text-sm disabled:opacity-50"
            @change="handleTypeChange(($event.target as HTMLSelectElement).value as EntityType)"
          >
            <option v-for="type in ENTITY_TYPES" :key="type.value" :value="type.value">
              {{ type.label }}
            </option>
          </select>
        </div>

        <!-- Template -->
        <div v-if="!isEditing" class="space-y-2">
          <Label for="templateKey">Template</Label>
          <select
            id="templateKey"
            :value="formData.templateKey"
            class="border-input bg-background h-9 w-full rounded-md border px-3 py-1 text-sm disabled:opacity-50"
            required
            @change="updateField('templateKey', ($event.target as HTMLSelectElement).value)"
          >
            <option
              v-for="template in availableTemplates"
              :key="template.key"
              :value="template.key"
            >
              {{ template.name }}
            </option>
          </select>
        </div>

        <!-- Name -->
        <div class="space-y-2">
          <Label for="name">Name</Label>
          <Input
            id="name"
            :model-value="formData.name"
            placeholder="My Account"
            required
            @update:model-value="updateField('name', $event as string)"
          />
        </div>

        <!-- Parent -->
        <div class="space-y-2">
          <Label for="parentId">Belongs to</Label>
          <select
            id="parentId"
            :value="formData.parentId || ''"
            class="border-input bg-background h-9 w-full rounded-md border px-3 py-1 text-sm disabled:opacity-50"
            @change="
              updateField('parentId', ($event.target as HTMLSelectElement).value || undefined)
            "
          >
            <option value="">None</option>
            <option v-for="parent in availableParents" :key="parent.id" :value="parent.id">
              {{ parent.name }}
            </option>
          </select>
        </div>

        <!-- Growth Rate -->
        <div v-if="hasGrowthRate" class="space-y-2">
          <Label for="growthRate">Growth Rate (%)</Label>
          <Input
            id="growthRate"
            type="number"
            step="0.1"
            :model-value="String((growthRateValue * 100).toFixed(2))"
            placeholder="3"
            @update:model-value="updateGrowthRate((parseFloat($event as string) || 0) / 100)"
          />
        </div>

        <!-- Debt type -->
        <template v-if="formData.type === EntityType.Debt">
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <Label for="interestRate">Interest Rate (%)</Label>
              <Input
                id="interestRate"
                type="number"
                step="0.1"
                :model-value="String((formData.interestRate * 100).toFixed(2))"
                placeholder="6.5"
                @update:model-value="
                  formData.interestRate = (parseFloat($event as string) || 0) / 100
                "
              />
            </div>
            <div class="space-y-2">
              <Label for="paymentAmount">Payment Amount</Label>
              <Input
                id="paymentAmount"
                type="number"
                step="0.01"
                :model-value="String(formData.paymentAmount)"
                placeholder="1850"
                @update:model-value="formData.paymentAmount = parseFloat($event as string) || 0"
              />
            </div>
          </div>

          <div class="space-y-2">
            <Label for="paymentSourceEntityId">Payment Source Account</Label>
            <select
              id="paymentSourceEntityId"
              :value="formData.paymentSourceEntityId"
              class="border-input bg-background h-9 w-full rounded-md border px-3 py-1 text-sm disabled:opacity-50"
              @change="formData.paymentSourceEntityId = ($event.target as HTMLSelectElement).value"
            >
              <option value="">Select an account</option>
              <option v-for="account in availableAccounts" :key="account.id" :value="account.id">
                {{ account.name }}
              </option>
            </select>
          </div>

          <ScheduleFields v-model="formData.paymentSchedule" label="Payment Schedule" />
        </template>

        <!-- Income type -->
        <template v-if="formData.type === EntityType.Income">
          <div class="space-y-2">
            <Label for="targetEntityId">Target Account</Label>
            <select
              id="targetEntityId"
              :value="formData.targetEntityId"
              class="border-input bg-background h-9 w-full rounded-md border px-3 py-1 text-sm disabled:opacity-50"
              @change="formData.targetEntityId = ($event.target as HTMLSelectElement).value"
            >
              <option value="">Select an account</option>
              <option v-for="account in availableAccounts" :key="account.id" :value="account.id">
                {{ account.name }}
              </option>
            </select>
          </div>

          <ScheduleFields
            :model-value="formData.schedule"
            label="Schedule"
            @update:model-value="updateSchedule"
          />
        </template>

        <!-- Expense type -->
        <template v-if="formData.type === EntityType.Expense">
          <div class="space-y-2">
            <Label for="sourceEntityId">Source Account</Label>
            <select
              id="sourceEntityId"
              :value="formData.sourceEntityId"
              class="border-input bg-background h-9 w-full rounded-md border px-3 py-1 text-sm disabled:opacity-50"
              @change="formData.sourceEntityId = ($event.target as HTMLSelectElement).value"
            >
              <option value="">Select an account</option>
              <option v-for="account in availableAccounts" :key="account.id" :value="account.id">
                {{ account.name }}
              </option>
            </select>
          </div>

          <ScheduleFields
            :model-value="formData.schedule"
            label="Schedule"
            @update:model-value="updateSchedule"
          />
        </template>

        <!-- Holding -->
        <div v-if="formData.type === EntityType.Holding" class="space-y-2">
          <Label for="symbol">Symbol</Label>
          <Input
            id="symbol"
            :model-value="formData.symbol"
            placeholder="VTI"
            @update:model-value="formData.symbol = $event as string"
          />
        </div>

        <!-- Ledger -->
        <LedgerEntryFields
          :entity-type="formData.type"
          :model-value="formData.ledgerEntries"
          @update:model-value="updateField('ledgerEntries', $event)"
        />

        <!-- Actions -->
        <div class="flex justify-end gap-2 border-t pt-4">
          <Button type="button" variant="outline" :disabled="isSubmitting" @click="handleClose">
            Cancel
          </Button>

          <Button type="submit" :disabled="isSubmitting">
            {{ isSubmitting ? "Saving..." : isEditing ? "Update" : "Create" }}
          </Button>
        </div>
      </form>
    </div>
  </div>
</template>
