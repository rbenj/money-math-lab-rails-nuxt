<script setup lang="ts">
import { Chart } from "vue-chartjs";
import {
  Chart as ChartJS,
  BarElement,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend,
} from "chart.js";
import annotationPlugin from "chartjs-plugin-annotation";
import { epochDayToDate } from "@/lib/date-utils";
import { formatAbbreviatedDisplayMoney, formatDisplayMoney } from "@/lib/money-utils";
import type { Plan } from "@/features/plan/plan";

ChartJS.register(
  BarElement,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend,
  annotationPlugin,
);

const props = defineProps<{
  plan: Plan;
}>();

const chartColors = ref({
  assets: "",
  debt: "",
  netWorth: "",
  line: "",
  text: "",
  background: "",
});

const colorsLoaded = ref(false);

onMounted(() => {
  const style = getComputedStyle(document.documentElement);
  chartColors.value = {
    assets: style.getPropertyValue("--chart-1").trim() || "oklch(0, 0, 0)",
    debt: style.getPropertyValue("--chart-2").trim() || "oklch(0, 0, 0)",
    netWorth: style.getPropertyValue("--chart-3").trim() || "oklch(0, 0, 0)",
    line: style.getPropertyValue("--chart-4").trim() || "oklch(0, 0, 0)",
    text: style.getPropertyValue("--muted-foreground").trim() || "oklch(0, 0, 0)",
    background: style.getPropertyValue("--background").trim() || "oklch(0, 0, 0)",
  };
  colorsLoaded.value = true;
});

const birthYear = computed(() => new Date(props.plan.birthDate).getUTCFullYear());
const currentAge = computed(() => new Date().getFullYear() - birthYear.value);

// Build raw data from Plan simulation
const rawData = computed(() => {
  const dataPoints = props.plan.getDataPointsForAllYears();
  const result: Array<{ age: number; assets: number; debt: number; netWorth: number }> = [];

  dataPoints.forEach((point, day) => {
    const year = epochDayToDate(day).getFullYear();
    const age = year - birthYear.value;
    result.push({
      age,
      assets: point.assets,
      debt: -point.debt,
      netWorth: point.netWorth,
    });
  });

  return result;
});

// Aggregate data to max 30 bars
const aggregatedData = computed(() => {
  const maxBars = 30;
  const all = rawData.value;

  if (all.length <= maxBars) {
    return all;
  }

  const groupSize = Math.ceil(all.length / maxBars);
  const aggregated: typeof all = [];

  for (let i = 0; i < all.length; i += groupSize) {
    const group = all.slice(i, i + groupSize);
    const first = group[0];
    if (!first) continue;

    const avgAssets = group.reduce((sum, d) => sum + d.assets, 0) / group.length;
    const avgDebt = group.reduce((sum, d) => sum + d.debt, 0) / group.length;
    const avgNetWorth = group.reduce((sum, d) => sum + d.netWorth, 0) / group.length;

    aggregated.push({
      age: first.age,
      assets: avgAssets,
      debt: avgDebt,
      netWorth: avgNetWorth,
    });
  }

  return aggregated;
});

// Find closest age in aggregated data for reference lines
const findClosestAge = (targetAge: number): number => {
  const data = aggregatedData.value;
  if (data.length === 0) return targetAge;

  return data.reduce((closest, current) => {
    const currentDiff = Math.abs(current.age - targetAge);
    const closestDiff = Math.abs(closest.age - targetAge);
    return currentDiff < closestDiff ? current : closest;
  }).age;
};

const todayAgeInData = computed(() => findClosestAge(currentAge.value));
const retirementAgeInData = computed(() => findClosestAge(props.plan.retirementAge));

// Calculate Y domain and custom ticks (skip the first/min tick like the old version)
const yDomain = computed(() => {
  const data = aggregatedData.value;
  if (data.length === 0) return { min: 0, max: 0 };

  const values = data.flatMap((d) => [d.assets, d.debt, d.netWorth]);
  return {
    min: Math.min(...values),
    max: Math.max(...values),
  };
});

const yTicks = computed(() => {
  const { min, max } = yDomain.value;

  // Handle case where all values are the same
  if (min === max) {
    return [min];
  }

  const tickCount = 5;
  const interval = (max - min) / (tickCount - 1);

  // Generate ticks and skip the first one (min value)
  const ticks = Array.from({ length: tickCount }, (_, i) => Math.round(min + interval * i)).slice(
    1,
  );

  // Remove duplicates
  return [...new Set(ticks)];
});

// Build chart data from aggregated data
const chartData = computed(() => {
  const data = aggregatedData.value;

  return {
    labels: data.map((d) => String(d.age)),
    datasets: [
      {
        type: "bar" as const,
        label: "Assets",
        data: data.map((d) => d.assets),
        backgroundColor: chartColors.value.assets,
        stack: "stack",
        borderRadius: { topLeft: 4, topRight: 4, bottomLeft: 0, bottomRight: 0 },
        order: 2,
      },
      {
        type: "bar" as const,
        label: "Debt",
        data: data.map((d) => d.debt),
        backgroundColor: chartColors.value.debt,
        stack: "stack",
        borderRadius: { topLeft: 0, topRight: 0, bottomLeft: 4, bottomRight: 4 },
        order: 2,
      },
      {
        type: "line" as const,
        label: "Net Worth",
        data: data.map((d) => d.netWorth),
        borderColor: chartColors.value.netWorth,
        borderWidth: 3,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: chartColors.value.netWorth,
        fill: false,
        tension: 0,
        order: 1,
      },
    ],
  };
});

// Chart options with annotations for Today and Retirement
const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  layout: {
    padding: {
      top: 30,
    },
  },
  interaction: {
    intersect: false,
    mode: "index" as const,
  },
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        title: () => "",
        label: (context: { raw: unknown; dataset: { label?: string } }) => {
          const value = Math.abs(context.raw as number);
          const name = context.dataset.label
            ?.replace(/([A-Z])/g, " $1")
            .replace(/^./, (str: string) => str.toUpperCase());
          return `${name}: ${formatDisplayMoney(value)}`;
        },
      },
    },
    annotation: {
      annotations: {
        todayLine: {
          type: "line" as const,
          drawTime: "beforeDatasetsDraw" as const,
          xMin: String(todayAgeInData.value),
          xMax: String(todayAgeInData.value),
          borderColor: chartColors.value.line,
          borderWidth: 2,
          borderDash: [5, 5],
          label: {
            display: true,
            content: "Today",
            position: "end" as const,
            yAdjust: 0,
            backgroundColor: chartColors.value.background,
            color: chartColors.value.line,
            font: { size: 12 },
            padding: 0,
          },
        },
        retirementLine: {
          type: "line" as const,
          drawTime: "beforeDatasetsDraw" as const,
          xMin: String(retirementAgeInData.value),
          xMax: String(retirementAgeInData.value),
          borderColor: chartColors.value.line,
          borderWidth: 2,
          borderDash: [5, 5],
          label: {
            display: true,
            content: "Retirement",
            position: "end" as const,
            yAdjust: 0,
            backgroundColor: chartColors.value.background,
            color: chartColors.value.line,
            font: { size: 12 },
            padding: 0,
          },
        },
      },
    },
  },
  scales: {
    x: {
      stacked: true,
      grid: { display: false },
      border: { display: false },
      ticks: {
        color: chartColors.value.text,
        font: { size: 11 },
        autoSkip: false,
        maxRotation: 0,
      },
    },
    y: {
      stacked: true,
      grid: { display: false },
      border: { display: false },
      position: "left" as const,
      min: yDomain.value.min,
      max: yDomain.value.max * 1.1,
      ticks: {
        mirror: true,
        color: chartColors.value.text,
        font: { size: 11 },
        callback: (value: string | number) => formatAbbreviatedDisplayMoney(Number(value)),
      },
      afterBuildTicks: (axis: { ticks: Array<{ value: number }> }) => {
        // Replace auto ticks with our custom ticks (skipping the first/min)
        axis.ticks = yTicks.value.map((value) => ({ value }));
      },
    },
  },
}));
</script>

<template>
  <div>
    <h3 class="mb-8 text-xl leading-none font-semibold tracking-tight md:text-2xl lg:text-3xl">
      Simulation
    </h3>

    <div class="aspect-2/1 min-h-[300px] w-full">
      <Chart
        v-if="colorsLoaded"
        type="bar"
        :data="chartData"
        :options="chartOptions"
        :plugins="[annotationPlugin]"
      />
    </div>
  </div>
</template>
