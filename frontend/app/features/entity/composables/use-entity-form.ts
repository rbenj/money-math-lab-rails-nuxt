import { dateStringToEpochDay } from '@/lib/date-utils';
import {
  EntityType,
  type EntityFormData,
  type ScheduleFormData,
  type SerializedEntity,
  type SerializedLedger,
} from '../types';
import type { Entity } from '../entity';
import { deserializeEntity } from '../serialization';
import { useEntityApi } from './use-entity-api';

function prepScheduleData(schedule: ScheduleFormData): Record<string, unknown> {
  return {
    type: schedule.type,
    daysOfMonth: schedule.daysOfMonth,
    daysOfWeek: schedule.daysOfWeek,
    interval: schedule.interval,
    startDate: schedule.startDate,
    endDate: schedule.endDate,
  };
}

function prepEntityData(formData: EntityFormData): SerializedEntity {
  const ledgerEntries: SerializedLedger = formData.ledgerEntries.map(entry => ({
    ...entry,
    day: dateStringToEpochDay(entry.day),
  }));

  const data: Record<string, unknown> = {};

  switch (formData.type) {
    case EntityType.Account:
      data.growthRate = formData.growthRate;
      break;

    case EntityType.Debt:
      data.interestRate = formData.interestRate;
      data.paymentAmount = formData.paymentAmount;
      data.paymentSchedule = prepScheduleData(formData.paymentSchedule);
      data.paymentSourceEntityId = formData.paymentSourceEntityId;
      break;

    case EntityType.Expense:
      data.growthRate = formData.growthRate;
      data.schedule = prepScheduleData(formData.schedule);
      data.sourceEntityId = formData.sourceEntityId;
      break;

    case EntityType.Holding:
      data.symbol = formData.symbol;
      data.growthRate = formData.growthRate;
      break;

    case EntityType.Income:
      data.growthRate = formData.growthRate;
      data.schedule = prepScheduleData(formData.schedule);
      data.targetEntityId = formData.targetEntityId;
      break;

    case EntityType.Possession:
      data.growthRate = formData.growthRate;
      break;
  }

  return {
    id: formData.id ?? '',
    name: formData.name ?? '',
    type: formData.type,
    templateKey: formData.templateKey,
    parentId: formData.parentId ?? null,
    data,
    ledgerEntries,
  };
}

export function useEntityForm() {
  const entityApi = useEntityApi();
  const isSubmitting = ref(false);

  async function createEntity(planId: string, formData: EntityFormData): Promise<Entity> {
    isSubmitting.value = true;
    try {
      const data = prepEntityData(formData);
      const serializedEntity = await entityApi.createEntity(planId, data);
      return deserializeEntity(serializedEntity);
    } finally {
      isSubmitting.value = false;
    }
  }

  async function updateEntity(entityId: string, formData: EntityFormData): Promise<Entity> {
    isSubmitting.value = true;
    try {
      const data = prepEntityData(formData);
      const serialized = await entityApi.updateEntity(entityId, data);
      return deserializeEntity(serialized);
    } finally {
      isSubmitting.value = false;
    }
  }

  return {
    isSubmitting,
    createEntity,
    updateEntity,
  };
}
