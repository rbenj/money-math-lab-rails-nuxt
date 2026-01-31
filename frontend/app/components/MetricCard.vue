<script setup lang="ts">
import { TrendingUp, TrendingDown } from "lucide-vue-next";
import { formatDisplayMoney } from "@/lib/money-utils";

const props = withDefaults(
  defineProps<{
    title: string;
    value: number;
    previousValue: number;
    trendLabel?: string;
  }>(),
  {
    trendLabel: "from previous period",
  },
);

const formattedValue = computed(() => formatDisplayMoney(Math.abs(props.value)));
const isUp = computed(() => props.value >= props.previousValue);
const TrendIcon = computed(() => (isUp.value ? TrendingUp : TrendingDown));

const trendDirection = computed(() => (isUp.value ? "Up" : "Down"));

const percentChange = computed(() => {
  if (!props.previousValue) return 0;
  return ((props.value - props.previousValue) / Math.abs(props.previousValue)) * 100;
});

const formattedPercent = computed(() => {
  const sign = percentChange.value >= 0 ? "+" : "";
  return `${sign}${percentChange.value.toFixed(1)}%`;
});
</script>

<template>
  <Card class="border-card-alt-border bg-card-alt">
    <CardHeader>
      <CardDescription class="text-card-alt-muted-foreground">
        {{ title }}
      </CardDescription>

      <CardTitle class="text-card-alt-foreground text-2xl tabular-nums">
        {{ formattedValue }}
      </CardTitle>

      <CardAction>
        <Badge variant="outline" class="border-card-alt-muted-foreground gap-1 rounded-full">
          <component :is="TrendIcon" class="h-3 w-3" />
          {{ formattedPercent }}
        </Badge>
      </CardAction>
    </CardHeader>

    <CardFooter>
      <div class="text-card-alt-muted-foreground flex gap-2">
        {{ trendDirection }} {{ trendLabel }}
        <component :is="TrendIcon" class="text-card-alt-foreground h-5 w-5" />
      </div>
    </CardFooter>
  </Card>
</template>
