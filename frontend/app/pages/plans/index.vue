<script setup lang="ts">
import { Plus, Settings, Trash2 } from "lucide-vue-next";
import type { SerializedPlanSummary } from "@/features/plan/types";
import { usePlanApi } from "@/features/plan/composables/use-plan-api";

definePageMeta({
  middleware: "auth",
});

const router = useRouter();
const planApi = usePlanApi();

const { data: plans, refresh } = await useAsyncData("plans", () => planApi.fetchPlanSummaries());

const isCreateModalOpen = ref(false);

const editingPlan = ref<SerializedPlanSummary | null>(null);

const deletingPlan = ref<SerializedPlanSummary | null>(null);
const isDeleteLoading = ref(false);

function handlePlanCreated(plan: SerializedPlanSummary) {
  isCreateModalOpen.value = false;
  router.push(`/plan/${plan.id}`);
}

async function handlePlanUpdated() {
  editingPlan.value = null;
  await refresh();
}

async function handleDeletePlan() {
  if (!deletingPlan.value) return;

  isDeleteLoading.value = true;
  try {
    await planApi.deletePlan(deletingPlan.value.id);
    deletingPlan.value = null;
    await refresh();
  } catch (error) {
    console.error("Failed to delete plan:", error);
  } finally {
    isDeleteLoading.value = false;
  }
}
</script>

<template>
  <div class="container mx-auto space-y-6 p-6">
    <!-- Header and controls -->
    <header class="flex items-center justify-between">
      <h1 class="text-3xl font-bold tracking-tight">Your Plans</h1>

      <Button @click="isCreateModalOpen = true">
        <Plus class="mr-1 h-4 w-4" />
        Create Plan
      </Button>
    </header>

    <!-- No plans -->
    <Card v-if="!plans || plans.length === 0">
      <CardContent class="py-12">
        <div class="space-y-4 text-center">
          <div class="text-muted-foreground">You don't have any plans yet.</div>
          <div class="text-muted-foreground text-sm">Create your first plan to get started.</div>
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

          <div class="text-muted-foreground flex items-center gap-1">
            <Button
              size="icon"
              variant="ghost"
              title="Edit plan settings"
              @click.prevent="editingPlan = plan"
            >
              <Settings />
              <span class="sr-only">Edit plan</span>
            </Button>

            <Button
              size="icon"
              variant="ghost"
              title="Delete plan"
              class="text-muted-foreground hover:text-destructive"
              @click.prevent="deletingPlan = plan"
            >
              <Trash2 />
              <span class="sr-only">Delete plan</span>
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <NuxtLink :to="`/plan/${plan.id}`" class="w-full">
            <Button class="w-full">Open Plan</Button>
          </NuxtLink>
        </CardContent>
      </Card>
    </div>

    <!-- Create plan modal -->
    <PlanFormModal
      :open="isCreateModalOpen"
      title="Create New Plan"
      submit-label="Create Plan"
      @close="isCreateModalOpen = false"
      @success="handlePlanCreated"
    />

    <!-- Edit plan modal -->
    <PlanFormModal
      v-if="editingPlan"
      :open="!!editingPlan"
      :plan-id="editingPlan.id"
      title="Edit Plan"
      :initial-data="editingPlan"
      submit-label="Save Changes"
      @close="editingPlan = null"
      @success="handlePlanUpdated"
    />

    <!-- Delete dialog -->
    <AlertDialog :open="!!deletingPlan">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Plan</AlertDialogTitle>

          <AlertDialogDescription>
            Are you sure you want to delete "{{ deletingPlan?.name }}"?
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel :disabled="isDeleteLoading" @click="deletingPlan = null">
            Cancel
          </AlertDialogCancel>

          <AlertDialogAction
            :disabled="isDeleteLoading"
            class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            @click.prevent="handleDeletePlan"
          >
            {{ isDeleteLoading ? "Deleting..." : "Delete" }}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>
