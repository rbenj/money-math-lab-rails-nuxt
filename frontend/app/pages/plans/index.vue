<script setup lang="ts">
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

definePageMeta({
  middleware: 'auth',
});

interface PlanData {
  id: string;
  name: string;
  birthDate: string;
  retirementAge: number;
  createdAt: string;
  updatedAt: string;
};

const { get } = useApi();

const { data: plans, refresh } = await useAsyncData('plans', () =>
  get<PlanData[]>('/plans'),
);

async function handlePlanCreated() {
  await refresh();
}

async function handlePlanDeleted() {
  await refresh();
}
</script>

<template>
  <div class="container mx-auto p-6 space-y-6">
    <!-- Header and controls -->
    <header class="flex items-center justify-between">
      <h1 class="text-3xl font-bold tracking-tight">Your Plans</h1>
      <!-- TODO: CreatePlanDialog @created="handlePlanCreated" -->
      <Button>New Plan</Button>
    </header>

    <!-- No plans -->
    <Card v-if="!plans || plans.length === 0">
      <CardContent class="py-12">
        <div class="text-center space-y-4">
          <div class="text-muted-foreground">You don't have any plans yet.</div>
          <div class="text-sm text-muted-foreground">Create your first plan to get started.</div>
        </div>
      </CardContent>
    </Card>

    <!-- Plans grid -->
    <div v-else class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card
        v-for="plan in plans"
        :key="plan.id"
        class="hover:border-foreground/20 transition-colors"
      >
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-lg font-medium">{{ plan.name }}</CardTitle>

          <div class="flex items-center gap-1">
            <!-- TODO: EditPlanButton -->
            <!-- TODO: DeletePlanButton -->
          </div>
        </CardHeader>

        <CardContent>
          <div class="text-xs text-muted-foreground mb-4">
            Created {{ new Date(plan.createdAt).toLocaleDateString() }}
          </div>

          <Button as-child class="w-full">
            <NuxtLink :to="`/plan/${plan.id}`">Open Plan</NuxtLink>
          </Button>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
