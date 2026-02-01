import type { SerializedEntity } from "../types";

function makeRailsPayload(data: SerializedEntity) {
  return {
    name: data.name,
    type: data.type,
    templateKey: data.templateKey,
    parentId: data.parentId,
    data: data.data,
    ledgerEntriesAttributes: data.ledgerEntries.map((entry) => ({
      id: entry.id,
      day: entry.day,
      amount: entry.amount,
      shareQuantity: entry.shareQuantity,
      sharePrice: entry.sharePrice,
      _destroy: entry.isDeleted,
    })),
  };
}

export function useEntityApi() {
  const { post, put, del } = useApi();

  async function createEntity(planId: string, data: SerializedEntity): Promise<SerializedEntity> {
    return await post<SerializedEntity>(`/plans/${planId}/entities`, {
      entity: makeRailsPayload(data),
    });
  }

  async function updateEntity(entityId: string, data: SerializedEntity): Promise<SerializedEntity> {
    return await put<SerializedEntity>(`/entities/${entityId}`, { entity: makeRailsPayload(data) });
  }

  async function deleteEntity(entityId: string): Promise<void> {
    return await del(`/entities/${entityId}`);
  }

  return {
    createEntity,
    updateEntity,
    deleteEntity,
  };
}
