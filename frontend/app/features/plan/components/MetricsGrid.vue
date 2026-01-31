<script setup lang="ts">
import type { Plan } from "@/features/plan/plan";

const props = defineProps<{
  plan: Plan;
}>();

const assets = computed(() => props.plan.getAssetsForToday());
const assetsLastYear = computed(() => props.plan.getAssetsForLastYear());

const debt = computed(() => props.plan.getDebtForToday());
const debtLastYear = computed(() => props.plan.getDebtForLastYear());

const netWorth = computed(() => props.plan.getNetWorthForToday());
const netWorthLastYear = computed(() => props.plan.getNetWorthForLastYear());
</script>

<template>
  <div class="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
    <MetricCard title="Assets" :value="assets" :previous-value="assetsLastYear" />
    <MetricCard title="Debt" :value="debt" :previous-value="debtLastYear" />
    <MetricCard title="Net Worth" :value="netWorth" :previous-value="netWorthLastYear" />
  </div>
</template>
