<script setup lang="ts">
export interface Metric {
  title: string;
  value: number;
  previousValue: number;
  trendLabel?: string;
}

defineProps<{
  metrics: Metric[];
}>();
</script>

<template>
  <div class="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
    <MetricCard
      v-for="metric in metrics"
      :key="metric.title"
      :title="metric.title"
      :value="metric.value"
      :previous-value="metric.previousValue"
      :trend-label="metric.trendLabel"
    />
  </div>
</template>
