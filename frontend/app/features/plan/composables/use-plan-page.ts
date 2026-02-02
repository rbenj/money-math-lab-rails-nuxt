import { calculateAge, getTodayEpochDay } from "@/lib/date-utils";
import { isEntityActive } from "@/features/entity/utils";
import type { Entity } from "@/features/entity/entity";
import type { SerializedPlanSummary } from "../types";
import { Plan } from "../plan";
import { usePlanApi } from "./use-plan-api";

export async function usePlanPage(planId: string) {
  const planApi = usePlanApi();

  // Single source of truth for today epoch day to avoid hydration mismatches
  const todayEpochDay = getTodayEpochDay();

  const { data: planData } = await useAsyncData(`plan-${planId}`, () => planApi.fetchPlan(planId));

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
    mutedEntityIds.value = new Set([...mutedEntityIds.value].filter((id) => id !== entityId));
    soloedEntityIds.value = new Set([...soloedEntityIds.value].filter((id) => id !== entityId));
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
