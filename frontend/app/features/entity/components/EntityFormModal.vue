<script setup lang="ts">
import { Loader2 } from "lucide-vue-next";
import { SLOW_LOADING_DELAY } from "@/constants";
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

const showSpinner = ref(false);
let spinnerTimeout: ReturnType<typeof setTimeout> | null = null;

watch(isSubmitting, (submitting) => {
  if (submitting) {
    spinnerTimeout = setTimeout(() => {
      showSpinner.value = true;
    }, SLOW_LOADING_DELAY);
  } else {
    if (spinnerTimeout) clearTimeout(spinnerTimeout);
    showSpinner.value = false;
  }
});

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

const growthRateDisplay = computed(() => {
  if ("growthRate" in formData.value) {
    return String(formData.value.growthRate * 100);
  }
  return "0";
});

const interestRateDisplay = computed(() => {
  if ("interestRate" in formData.value) {
    return String(formData.value.interestRate * 100);
  }
  return "0";
});
</script>

<template>
  <Dialog :open="open" @update:open="(val) => !val && handleClose()">
    <DialogScrollContent class="max-w-2xl">
      <DialogHeader>
        <DialogTitle>{{ title }}</DialogTitle>

        <DialogDescription class="sr-only">
          {{ isEditing ? "Edit entity details" : "Create a new entity" }}
        </DialogDescription>
      </DialogHeader>

      <form
        class="space-y-4 transition-opacity"
        :class="{ 'pointer-events-none opacity-50': isSubmitting }"
        @submit.prevent="handleSubmit"
      >
        <!-- Entity type -->
        <div v-if="!isEditing" class="space-y-2">
          <Label for="type">Type</Label>
          <Select
            :model-value="formData.type"
            @update:model-value="handleTypeChange($event as EntityType)"
          >
            <SelectTrigger id="type" class="w-full">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="type in ENTITY_TYPES" :key="type.value" :value="type.value">
                {{ type.label }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <!-- Template -->
        <div v-if="!isEditing" class="space-y-2">
          <Label for="templateKey">Template</Label>
          <Select
            :model-value="formData.templateKey"
            @update:model-value="updateField('templateKey', String($event))"
          >
            <SelectTrigger id="templateKey" class="w-full">
              <SelectValue placeholder="Select template" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                v-for="template in availableTemplates"
                :key="template.key"
                :value="template.key"
              >
                {{ template.name }}
              </SelectItem>
            </SelectContent>
          </Select>
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
          <Select
            :model-value="formData.parentId || '__none__'"
            @update:model-value="
              updateField('parentId', $event === '__none__' ? undefined : String($event))
            "
          >
            <SelectTrigger id="parentId" class="w-full">
              <SelectValue placeholder="None" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">None</SelectItem>
              <SelectItem v-for="parent in availableParents" :key="parent.id" :value="parent.id">
                {{ parent.name }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <!-- Growth rate -->
        <div v-if="hasGrowthRate" class="space-y-2">
          <Label for="growthRate">Growth Rate (%)</Label>
          <input
            id="growthRate"
            type="number"
            step="0.1"
            class="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            :value="growthRateDisplay"
            placeholder="3"
            @change="
              (e: Event) => {
                if ('growthRate' in formData) {
                  formData.growthRate =
                    (parseFloat((e.target as HTMLInputElement).value) || 0) / 100;
                }
              }
            "
          />
        </div>

        <!-- Debt type -->
        <template v-if="formData.type === EntityType.Debt">
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <Label for="interestRate">Interest Rate (%)</Label>
              <input
                id="interestRate"
                type="number"
                step="0.1"
                class="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                :value="interestRateDisplay"
                placeholder="6.5"
                @change="
                  (e: Event) => {
                    if ('interestRate' in formData) {
                      formData.interestRate =
                        (parseFloat((e.target as HTMLInputElement).value) || 0) / 100;
                    }
                  }
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
            <Select
              :model-value="formData.paymentSourceEntityId"
              @update:model-value="formData.paymentSourceEntityId = String($event)"
            >
              <SelectTrigger id="paymentSourceEntityId" class="w-full">
                <SelectValue placeholder="Select an account" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="account in availableAccounts"
                  :key="account.id"
                  :value="account.id"
                >
                  {{ account.name }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <ScheduleFields v-model="formData.paymentSchedule" label="Payment Schedule" />
        </template>

        <!-- Income type -->
        <template v-if="formData.type === EntityType.Income">
          <div class="space-y-2">
            <Label for="targetEntityId">Target Account</Label>
            <Select
              :model-value="formData.targetEntityId"
              @update:model-value="formData.targetEntityId = String($event)"
            >
              <SelectTrigger id="targetEntityId" class="w-full">
                <SelectValue placeholder="Select an account" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="account in availableAccounts"
                  :key="account.id"
                  :value="account.id"
                >
                  {{ account.name }}
                </SelectItem>
              </SelectContent>
            </Select>
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
            <Select
              :model-value="formData.sourceEntityId"
              @update:model-value="formData.sourceEntityId = String($event)"
            >
              <SelectTrigger id="sourceEntityId" class="w-full">
                <SelectValue placeholder="Select an account" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="account in availableAccounts"
                  :key="account.id"
                  :value="account.id"
                >
                  {{ account.name }}
                </SelectItem>
              </SelectContent>
            </Select>
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

        <DialogFooter>
          <Button type="button" variant="outline" :disabled="isSubmitting" @click="handleClose">
            Cancel
          </Button>
          <Button type="submit" :disabled="isSubmitting">
            <Loader2 v-if="showSpinner" class="mr-2 animate-spin" />
            {{ isEditing ? "Update" : "Create" }}
          </Button>
        </DialogFooter>
      </form>
    </DialogScrollContent>
  </Dialog>
</template>
