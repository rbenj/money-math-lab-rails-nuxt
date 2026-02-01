<script setup lang="ts">
import { ArrowLeft, Cake, PalmtreeIcon, Settings } from "lucide-vue-next";
import type { SerializedPlanSummary } from "@/features/plan/types";
import { usePlanPage } from "@/features/plan/composables/use-plan-page";

definePageMeta({
  middleware: "auth",
});

const route = useRoute();
const planId = (route.params.planId || "").toString();

const {
  plan,
  planName,
  currentAge,
  retirementAge,
  filteredPlan,
  activeEntityIds,
  mutedEntityIds,
  soloedEntityIds,
  toggleMute,
  toggleSolo,
  handlePlanUpdated,
  handleEntityCreated,
  handleEntityUpdated,
  handleEntityDeleted,
} = await usePlanPage(planId);

const isSettingsOpen = ref(false);

const metrics = computed(() => [
  {
    title: "Assets",
    value: filteredPlan.value.getAssetsForToday(),
    previousValue: filteredPlan.value.getAssetsForLastYear(),
    trendLabel: "from last year",
  },
  {
    title: "Debt",
    value: filteredPlan.value.getDebtForToday(),
    previousValue: filteredPlan.value.getDebtForLastYear(),
    trendLabel: "from last year",
  },
  {
    title: "Net Worth",
    value: filteredPlan.value.getNetWorthForToday(),
    previousValue: filteredPlan.value.getNetWorthForLastYear(),
    trendLabel: "from last year",
  },
]);

function onPlanUpdated(summary: SerializedPlanSummary) {
  handlePlanUpdated(summary);
  isSettingsOpen.value = false;
}
</script>

<template>
  <div class="flex h-full flex-col gap-8 px-4 lg:flex-row lg:gap-14 lg:px-12">
    <!-- Left -->
    <aside class="order-2 h-full w-full pt-4 lg:order-1 lg:w-2/5 xl:w-1/3">
      <EntitiesList
        :plan="plan"
        :filtered-plan="filteredPlan"
        :active-entity-ids="activeEntityIds"
        :muted-entity-ids="mutedEntityIds"
        :soloed-entity-ids="soloedEntityIds"
        @mute="toggleMute"
        @solo="toggleSolo"
        @entity-created="handleEntityCreated"
        @entity-updated="handleEntityUpdated"
        @entity-deleted="handleEntityDeleted"
      />
    </aside>

    <!-- Right -->
    <section class="order-1 flex-1 lg:order-2">
      <!-- Sticky container -->
      <div class="flex flex-col gap-8 pt-3 lg:sticky lg:top-20">
        <!-- Plan header -->
        <header
          class="items-between flex flex-col pb-2 xl:flex-row xl:items-start xl:justify-between"
        >
          <!-- Breadcrumb -->
          <div class="flex items-center gap-3 text-xl tracking-tight md:text-2xl lg:text-3xl">
            <NuxtLink
              to="/plans"
              aria-label="Back to plans"
              class="relative flex h-10 w-10 items-center justify-center opacity-70 transition-opacity hover:opacity-100"
            >
              <svg class="absolute inset-0 h-full w-full" viewBox="0 0 64 64" aria-hidden="true">
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
              <ArrowLeft :size="20" aria-hidden="true" />
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
            class="text-muted-foreground z-2 mt-6 -mb-16 flex items-center justify-end gap-6 xl:m-0 xl:justify-start xl:pt-1"
          >
            <div class="flex items-center gap-1 text-sm" :aria-label="`Current age: ${currentAge}`">
              <Cake aria-hidden="true" />
              <span>{{ currentAge }}</span>
            </div>

            <div
              class="flex items-center gap-1 text-sm"
              :aria-label="`Retirement age: ${retirementAge}`"
            >
              <PalmtreeIcon aria-hidden="true" />
              <span>{{ retirementAge }}</span>
            </div>

            <Button variant="ghost" size="icon" title="Edit plan" @click="isSettingsOpen = true">
              <Settings class="size-6" />
              <span class="sr-only">Edit plan</span>
            </Button>
          </div>
        </header>

        <!-- Plan content -->
        <SimulationChart :plan="filteredPlan" />
        <MetricsGrid :metrics="metrics" />
      </div>
    </section>

    <!-- Edit plan modal -->
    <PlanFormModal
      :open="isSettingsOpen"
      :plan-id="planId"
      :initial-data="plan.toSerialized()"
      title="Plan Settings"
      submit-label="Save Changes"
      @close="isSettingsOpen = false"
      @success="onPlanUpdated"
    />
  </div>
</template>
