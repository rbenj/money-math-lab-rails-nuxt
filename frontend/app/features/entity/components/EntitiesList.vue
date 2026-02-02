<script setup lang="ts">
import { Plus } from "lucide-vue-next";
import { parseApiError } from "@/lib/error-utils";
import { formatAbbreviatedDisplayMoney } from "@/lib/money-utils";
import type { Plan } from "@/features/plan/plan";
import { sortEntities } from "@/features/entity/utils";
import type { Entity } from "@/features/entity/entity";
import { useEntityApi } from "@/features/entity/composables/use-entity-api";
import { AccountEntity } from "@/features/entity/entity-types/account-entity";
import { FallbackEntity } from "@/features/entity/entity-types/fallback-entity";

const props = defineProps<{
  plan: Plan;
  filteredPlan: Plan;
  activeEntityIds: Set<string>;
  mutedEntityIds: Set<string>;
  soloedEntityIds: Set<string>;
}>();

const emit = defineEmits<{
  mute: [entityId: string];
  solo: [entityId: string];
  "entity-created": [entity: Entity];
  "entity-updated": [entity: Entity];
  "entity-deleted": [entityId: string];
}>();

const entityApi = useEntityApi();

const editingEntity = ref<Entity | null>(null);
const deletingEntity = ref<Entity | null>(null);
const isCreateModalOpen = ref(false);
const isDeleting = ref(false);
const deleteErrorMessage = ref<string | null>(null);

const displayEntities = computed(() => {
  const allEntities = props.plan.entities.filter((e) => !(e instanceof FallbackEntity));
  return sortEntities(allEntities);
});

const cashEntity = computed(() => props.plan.entities.find((e) => e instanceof FallbackEntity));
const cashValue = computed(() =>
  cashEntity.value ? props.filteredPlan.getEntityValue(cashEntity.value) : 0,
);

function formatDisplayValue(entityId: string): string {
  const value = props.filteredPlan.getEntityDisplayValue(entityId);
  return value ? formatAbbreviatedDisplayMoney(value) : "";
}

// Children can't be parents
const availableParents = computed(() =>
  props.plan.entities
    .filter((e) => !(e instanceof FallbackEntity) && !e.parentId)
    .map((e) => ({ id: e.id, name: e.name })),
);

const availableAccounts = computed(() =>
  props.plan.entities
    .filter((e) => e instanceof AccountEntity)
    .map((e) => ({ id: e.id, name: e.name })),
);

const editingEntityHasChildren = computed(() => {
  if (!editingEntity.value) return false;
  return props.plan.entities.some((e) => e.parentId === editingEntity.value!.id);
});

function handleEntityCreated(entity: Entity) {
  emit("entity-created", entity);
  isCreateModalOpen.value = false;
}

function handleEntityUpdated(entity: Entity) {
  emit("entity-updated", entity);
  editingEntity.value = null;
}

async function handleDelete() {
  if (!deletingEntity.value) return;

  deleteErrorMessage.value = null;
  isDeleting.value = true;
  try {
    await entityApi.deleteEntity(deletingEntity.value.id);
    emit("entity-deleted", deletingEntity.value.id);
    deletingEntity.value = null;
  } catch (e) {
    deleteErrorMessage.value = parseApiError(e, "Failed to delete entity. Please try again.");
    console.error("Failed to delete entity", e);
  } finally {
    isDeleting.value = false;
  }
}

function handleCancelDelete() {
  deletingEntity.value = null;
  deleteErrorMessage.value = null;
}
</script>

<template>
  <div>
    <!-- Header -->
    <div class="mb-4 flex items-center justify-between">
      <h3 class="text-lg font-semibold">Entities</h3>
      <div class="flex items-center gap-6">
        <div v-if="cashValue" class="text-md flex gap-1">
          Cash: <span class="font-semibold">{{ formatAbbreviatedDisplayMoney(cashValue) }}</span>
        </div>

        <Button class="gap-1" @click="isCreateModalOpen = true">
          <Plus />
          Create
        </Button>
      </div>
    </div>

    <!-- Empty state -->
    <div v-if="displayEntities.length === 0" class="text-muted-foreground py-8 text-center">
      <div>No entities.</div>
      <div class="text-sm">Create one.</div>
    </div>

    <!-- Entity list -->
    <div v-else class="flex flex-col gap-2">
      <EntityItem
        v-for="entity in displayEntities"
        :key="entity.id"
        :entity="entity"
        :display-name="entity.name"
        :display-value="formatDisplayValue(entity.id)"
        :is-active="activeEntityIds.has(entity.id)"
        :is-child="!!entity.parentId"
        :is-muted="mutedEntityIds.has(entity.id)"
        :is-soloed="soloedEntityIds.has(entity.id)"
        @mute="emit('mute', $event)"
        @solo="emit('solo', $event)"
        @edit="editingEntity = entity"
        @delete="deletingEntity = entity"
      />
    </div>

    <!-- Create modal -->
    <EntityFormModal
      :open="isCreateModalOpen"
      title="Create Entity"
      :plan-id="plan.id"
      :available-parents="availableParents"
      :available-accounts="availableAccounts"
      @close="isCreateModalOpen = false"
      @success="handleEntityCreated"
    />

    <!-- Edit modal -->
    <EntityFormModal
      v-if="editingEntity"
      :open="!!editingEntity"
      title="Edit Entity"
      :plan-id="plan.id"
      :entity-id="editingEntity.id"
      :initial-entity="editingEntity"
      :available-parents="availableParents"
      :available-accounts="availableAccounts"
      :has-children="editingEntityHasChildren"
      @close="editingEntity = null"
      @success="handleEntityUpdated"
    />

    <!-- Delete dialog -->
    <AlertDialog :open="!!deletingEntity">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Entity</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete "{{ deletingEntity?.name }}"?
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div v-if="deleteErrorMessage" class="text-destructive text-sm" role="alert">
          {{ deleteErrorMessage }}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel :disabled="isDeleting" @click="handleCancelDelete">
            Cancel
          </AlertDialogCancel>

          <AlertDialogAction
            :disabled="isDeleting"
            class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            @click.prevent="handleDelete"
          >
            {{ isDeleting ? "Deleting..." : "Delete" }}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>
