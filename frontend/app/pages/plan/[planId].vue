<script setup lang="ts">
// TODO: Import once ported
// import { Plan } from '@/features/plan/plan';
// import { deserializeEntities } from '@/features/entity/serialization';
// import { isEntityActive } from '@/features/entity/utils';
// import type { Entity, SerializedEntity } from '@/features/entity/entity';

definePageMeta({
  middleware: 'auth',
});

interface SerializedEntity {
  id: string;
  planId: string;
  name: string;
  type: string;
  templateKey: string;
  parentId: string | null;
  data: Record<string, unknown>;
  ledgerEntries: Array<{
    id: string;
    entityId: string;
    day: number;
    amount: number | null;
    shareQuantity: number | null;
    sharePrice: number | null;
  }>;
  createdAt: string;
  updatedAt: string;
}

interface PlanApiResponse {
  id: string;
  name: string;
  birthDate: string;
  retirementAge: number;
  entities: SerializedEntity[];
}

const route = useRoute();
const { get } = useApi();

const { data: planData } = await useAsyncData(
  `plan-${route.params.planId}`,
  () => get<PlanApiResponse>(`/plans/${route.params.planId}`),
);

if (!planData.value) {
  throw createError({ statusCode: 404, message: 'Plan not found' });
}

const planName = ref(planData.value.name);
const birthDate = ref(planData.value.birthDate);
const retirementAge = ref(planData.value.retirementAge);
const entities = ref(planData.value.entities);
const mutedEntityIds = ref(new Set<string>());
const soloedEntityIds = ref(new Set<string>());

// TODO: Build the Plan object when Plan class is ported
// const plan = computed(() => {
//   return new Plan({
//     name: planName.value,
//     entities: deserializeEntities(entities.value),
//     birthDate: birthDate.value,
//     retirementAge: retirementAge.value,
//   });
// });

function handleMute(entityId: string) {
  const next = new Set(mutedEntityIds.value);
  if (next.has(entityId)) {
    next.delete(entityId);
  } else {
    next.add(entityId);
  }
  mutedEntityIds.value = next;
}

function handleSolo(entityId: string) {
  const next = new Set(soloedEntityIds.value);
  if (next.has(entityId)) {
    next.delete(entityId);
  } else {
    next.add(entityId);
  }
  soloedEntityIds.value = next;
}

function handleEntityCreated(entity: SerializedEntity) {
  entities.value = [...entities.value, entity];
}

function handleEntityUpdated(updated: SerializedEntity) {
  entities.value = entities.value.map(e =>
    e.id === updated.id ? updated : e,
  );
}

function handleEntityDeleted(entityId: string) {
  entities.value = entities.value.filter(e => e.id !== entityId);
  mutedEntityIds.value.delete(entityId);
  soloedEntityIds.value.delete(entityId);
}

function handleSettingsUpdated(data: { name: string; birthDate: string; retirementAge: number }) {
  planName.value = data.name;
  birthDate.value = data.birthDate;
  retirementAge.value = data.retirementAge;
}
</script>

<template>
  <div class="flex flex-col h-full gap-8 px-4 lg:flex-row lg:gap-14 lg:px-12">
    <!-- Left column -->
    <aside class="order-2 h-full w-full pt-4 lg:order-1 lg:w-2/5 xl:w-1/3">
      <!-- TODO: EntitiesList component -->

      <div class="space-y-4">
        <h2 class="text-xl font-semibold">Entities</h2>

        <div v-for="entity in entities" :key="entity.id" class="p-4 border rounded-lg">
          <div class="flex items-center justify-between">
            <span class="font-medium">{{ entity.name }}</span>
            <span class="text-sm text-muted-foreground">{{ entity.type }}</span>
          </div>
        </div>

        <div v-if="entities.length === 0" class="text-muted-foreground">
          No entities yet. Add your first income, expense, or account.
        </div>
      </div>
    </aside>

    <!-- Right -->
    <section class="order-1 flex-1 lg:order-2">
      <div class="pt-3 flex flex-col gap-8 lg:sticky lg:top-20">
        <!-- Header -->
        <div class="flex items-center justify-between">
          <h1 class="text-2xl font-bold">{{ planName }}</h1>

          <!-- TODO: PlanHeader with settings modal -->
        </div>

        <!-- TODO: SimulationChart -->
        <div class="h-64 border rounded-lg flex items-center justify-center text-muted-foreground">
          Chart goes here
        </div>

        <!-- TODO: MetricsGrid -->
        <div class="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div class="p-4 border rounded-lg">
            <div class="text-sm text-muted-foreground">Birth Date</div>
            <div class="text-lg font-semibold">{{ birthDate }}</div>
          </div>

          <div class="p-4 border rounded-lg">
            <div class="text-sm text-muted-foreground">Retirement Age</div>
            <div class="text-lg font-semibold">{{ retirementAge }}</div>
          </div>

          <div class="p-4 border rounded-lg">
            <div class="text-sm text-muted-foreground">Entities</div>
            <div class="text-lg font-semibold">{{ entities.length }}</div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
