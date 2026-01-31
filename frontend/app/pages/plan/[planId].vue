<script setup lang="ts">
import { ArrowLeft, Cake, PalmtreeIcon, Settings } from "lucide-vue-next";
import { calculateAgeFromDate } from "@/lib/date-utils";
import { isEntityActive } from "@/features/entity/utils";
import type { Entity } from "@/features/entity/entity";
import type { SerializedPlanSummary } from "@/features/plan/types";
import { Plan } from "@/features/plan/plan";
import { usePlanApi } from "@/features/plan/composables/use-plan-api";

definePageMeta({
  middleware: "auth",
});

const route = useRoute();
const planApi = usePlanApi();

const { data: planData } = await useAsyncData(`plan-${route.params.planId}`, () =>
  planApi.fetchPlan(route.params.planId as string),
);

if (!planData.value) {
  throw createError({ statusCode: 404, message: "Plan not found" });
}

const plan = Plan.fromSerialized(planData.value);

const planName = ref(plan.name);
const birthDate = ref(plan.birthDate);
const retirementAge = ref(plan.retirementAge);
const entities = ref<Entity[]>(plan.entities);
const mutedEntityIds = ref(new Set<string>());
const soloedEntityIds = ref(new Set<string>());
const isSettingsOpen = ref(false);

const currentAge = computed(() => calculateAgeFromDate(new Date(), birthDate.value));

const entitiesMap = computed(() => {
  return new Map(entities.value.map((e) => [e.id, e]));
});

const activeEntityIds = computed(() => {
  return new Set(
    entities.value
      .filter((e) =>
        isEntityActive(e, soloedEntityIds.value, mutedEntityIds.value, entitiesMap.value),
      )
      .map((e) => e.id),
  );
});

// Current plan summary gets passed to the settings modal
const currentPlanSummary = computed(
  (): SerializedPlanSummary => ({
    id: route.params.planId as string,
    name: planName.value,
    birthDate: birthDate.value,
    retirementAge: retirementAge.value,
  }),
);

// Build the filtered plan that the simulation will run on
const filteredPlan = computed(() => {
  const activeEntities = entities.value.filter((e) => activeEntityIds.value.has(e.id));
  return new Plan({
    id: route.params.planId as string,
    name: planName.value,
    birthDate: birthDate.value,
    retirementAge: retirementAge.value,
    entities: activeEntities,
  }).simulate();
});

function handlePlanUpdated(planSummary: SerializedPlanSummary) {
  planName.value = planSummary.name;
  birthDate.value = planSummary.birthDate;
  retirementAge.value = planSummary.retirementAge;
  isSettingsOpen.value = false;
}

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

function handleEntityCreated(entity: Entity) {
  entities.value = [...entities.value, entity];
}

function handleEntityUpdated(updated: Entity) {
  entities.value = entities.value.map((e) => (e.id === updated.id ? updated : e));
}

function handleEntityDeleted(entityId: string) {
  entities.value = entities.value.filter((e) => e.id !== entityId);
  mutedEntityIds.value.delete(entityId);
  soloedEntityIds.value.delete(entityId);
}
</script>

<template>
  <div class="flex h-full flex-col gap-8 px-4 lg:flex-row lg:gap-14 lg:px-12">
    <!-- Left -->
    <aside class="order-2 h-full w-full pt-4 lg:order-1 lg:w-2/5 xl:w-1/3">
      <ClientOnly>
        <EntitiesList
          :plan-id="route.params.planId as string"
          :plan="plan"
          :filtered-plan="filteredPlan"
          :active-entity-ids="activeEntityIds"
          :muted-entity-ids="mutedEntityIds"
          :soloed-entity-ids="soloedEntityIds"
          @mute="handleMute"
          @solo="handleSolo"
          @entity-created="handleEntityCreated"
          @entity-updated="handleEntityUpdated"
          @entity-deleted="handleEntityDeleted"
        />
      </ClientOnly>
    </aside>

    <!-- Right -->
    <section class="order-1 flex-1 lg:order-2">
      <!-- Sticky container -->
      <div class="flex flex-col gap-8 pt-3 lg:sticky lg:top-20">
        <!-- Header -->
        <header
          class="items-between flex flex-col pb-2 xl:flex-row xl:items-start xl:justify-between"
        >
          <!-- Breadcrumb -->
          <div class="flex items-center gap-3 text-xl tracking-tight md:text-2xl lg:text-3xl">
            <NuxtLink
              to="/plans"
              class="relative flex h-10 w-10 items-center justify-center opacity-70 transition-opacity hover:opacity-100"
            >
              <svg class="absolute inset-0 h-full w-full" viewBox="0 0 64 64">
                <circle
                  cx="32"
                  cy="32"
                  r="30"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-dasharray="5.9 5.9"
                  class="text-foreground"
                />
              </svg>
              <ArrowLeft :size="20" />
            </NuxtLink>

            <div class="flex">
              <NuxtLink
                to="/plans"
                class="text-muted-foreground hover:text-foreground mr-2 whitespace-nowrap no-underline"
              >
                Plans /
              </NuxtLink>
              <span class="font-semibold">{{ planName }}</span>
            </div>
          </div>

          <!-- Controls -->
          <div
            class="z-2 mt-6 -mb-16 flex items-center justify-end gap-6 xl:m-0 xl:justify-start xl:pt-1"
          >
            <ClientOnly>
              <div
                class="text-muted-foreground flex items-center gap-1 text-sm"
                title="Current age"
              >
                <Cake class="h-6 w-6" />
                <span>{{ currentAge }}</span>
              </div>
            </ClientOnly>

            <div
              class="text-muted-foreground flex items-center gap-1 text-sm"
              title="Retirement age"
            >
              <PalmtreeIcon class="h-6 w-6" />
              <span>{{ retirementAge }}</span>
            </div>

            <button
              class="text-muted-foreground hover:text-foreground"
              title="Edit plan"
              @click="isSettingsOpen = true"
            >
              <Settings class="h-6 w-6" />
              <span class="sr-only">Edit plan</span>
            </button>
          </div>
        </header>

        <ClientOnly>
          <SimulationChart :plan="filteredPlan" />
          <MetricsGrid :plan="filteredPlan" />
        </ClientOnly>
      </div>
    </section>

    <!-- Settings Modal -->
    <PlanFormModal
      :open="isSettingsOpen"
      :plan-id="route.params.planId as string"
      title="Plan Settings"
      :initial-data="currentPlanSummary"
      submit-label="Save Changes"
      @close="isSettingsOpen = false"
      @success="handlePlanUpdated"
    />
  </div>
</template>
