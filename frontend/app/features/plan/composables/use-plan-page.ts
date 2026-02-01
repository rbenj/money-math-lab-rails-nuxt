import { calculateAge, getTodayEpochDay } from "@/lib/date-utils";
import { isEntityActive } from "@/features/entity/utils";
import type { Entity } from "@/features/entity/entity";
import type { SerializedPlanSummary } from "../types";
import { Plan } from "../plan";
import { usePlanApi } from "./use-plan-api";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function usePlanPage(planId: string) {
  const planApi = usePlanApi();

  // Single source of truth for today epoch day to avoid hydration mismatches
  const todayEpochDay = getTodayEpochDay();

  const {
    data: planData,
    error: planError,
    refresh: refreshPlan,
  } = await useAsyncData(`plan-${planId}`, () => planApi.fetchPlan(planId), {
    // Dedupe concurrent requests to mitigate Vite HMR/reload race condition
    dedupe: "defer",
  });

  // Retry with backoff on error (extra measure to ensure demo works after Vite is first initialized)
  const retryDelays = [150, 300, 600];

  for (
    let attempt = 0;
    attempt < retryDelays.length && (planError.value || !planData.value);
    attempt++
  ) {
    await sleep(retryDelays[attempt]!);
    await refreshPlan();
  }

  if (!planData.value) {
    throw createError({ statusCode: 404, message: "Plan not found" });
  }

  const basePlan = Plan.fromSerialized(planData.value, todayEpochDay);

  const planName = ref(basePlan.name);
  const birthDate = ref(basePlan.birthDate);
  const retirementAge = ref(basePlan.retirementAge);
  const entities = ref<Entity[]>(basePlan.entities);
  const mutedEntityIds = ref(new Set<string>());
  const soloedEntityIds = ref(new Set<string>());

  const currentAge = computed(() => calculateAge(birthDate.value, todayEpochDay));

  const plan = computed(
    () =>
      new Plan({
        id: planId,
        name: planName.value,
        birthDate: birthDate.value,
        retirementAge: retirementAge.value,
        entities: entities.value,
        todayEpochDay,
      }),
  );

  const entitiesMap = computed(() => new Map(entities.value.map((e) => [e.id, e])));

  const activeEntityIds = computed(
    () =>
      new Set(
        entities.value
          .filter((e) =>
            isEntityActive(e, soloedEntityIds.value, mutedEntityIds.value, entitiesMap.value),
          )
          .map((e) => e.id),
      ),
  );

  const filteredPlan = computed(() => {
    const activeEntities = entities.value.filter((e) => activeEntityIds.value.has(e.id));
    return new Plan({
      id: planId,
      name: planName.value,
      birthDate: birthDate.value,
      retirementAge: retirementAge.value,
      entities: activeEntities,
      todayEpochDay,
    }).simulate();
  });

  function toggleMute(entityId: string) {
    const next = new Set(mutedEntityIds.value);
    if (next.has(entityId)) {
      next.delete(entityId);
    } else {
      next.add(entityId);
    }
    mutedEntityIds.value = next;
  }

  function toggleSolo(entityId: string) {
    const next = new Set(soloedEntityIds.value);
    if (next.has(entityId)) {
      next.delete(entityId);
    } else {
      next.add(entityId);
    }
    soloedEntityIds.value = next;
  }

  function handlePlanUpdated(summary: SerializedPlanSummary) {
    planName.value = summary.name;
    birthDate.value = summary.birthDate;
    retirementAge.value = summary.retirementAge;
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

  return {
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
  };
}
