import type { Entity } from './entity';
import { EntityCategory } from './entity-template';
import { getEntityTemplate, ENTITY_CATEGORY_SORT_ORDER } from './entity-templates';

/**
 * Determine if an entity is active based on mute and solo states.
 */
export function isEntityActive(
  entity: Entity,
  soloedIds: Set<string>,
  mutedIds: Set<string>,
  entitiesMap: Map<string, Entity>,
): boolean {
  // Check mute first (mute always applies)
  if (mutedIds.has(entity.id)) {
    return false;
  }

  // Check if any ancestor is muted
  let parent = entity.parentId ? entitiesMap.get(entity.parentId) : null;
  while (parent) {
    if (mutedIds.has(parent.id)) {
      return false;
    }
    parent = parent.parentId ? entitiesMap.get(parent.parentId) : null;
  }

  // Limit to only soloed entities if there are any
  if (soloedIds.size > 0) {
    if (soloedIds.has(entity.id)) {
      return true;
    }

    // Check if any ancestor is soloed
    parent = entity.parentId ? entitiesMap.get(entity.parentId) : null;
    while (parent) {
      if (soloedIds.has(parent.id)) {
        return true;
      }
      parent = parent.parentId ? entitiesMap.get(parent.parentId) : null;
    }

    return false;
  }

  // Not excluded by other solos, and not muted
  return true;
}

/**
 * Sort entities by parent, category, and then original order.
 */
export function sortEntities(entities: Entity[]): Entity[] {
  const getCategory = (entity: Entity): EntityCategory => {
    const template = getEntityTemplate(entity.templateKey);
    return template?.category ?? EntityCategory.Investment;
  };

  const getCategoryIndex = (category: EntityCategory): number => {
    const index = ENTITY_CATEGORY_SORT_ORDER.indexOf(category);
    return index === -1 ? ENTITY_CATEGORY_SORT_ORDER.length : index;
  };

  // Separate parents and children
  const parents = entities.filter(e => !e.parentId);
  const childrenByParent = new Map<string, Entity[]>();

  for (const entity of entities) {
    if (entity.parentId) {
      const children = childrenByParent.get(entity.parentId) ?? [];
      children.push(entity);
      childrenByParent.set(entity.parentId, children);
    }
  }

  // Sort parents by category
  const sortedParents = [...parents].sort((a, b) => {
    const categoryA = getCategoryIndex(getCategory(a));
    const categoryB = getCategoryIndex(getCategory(b));
    return categoryA - categoryB;
  });

  // Add parents and their children
  const result: Entity[] = [];
  for (const parent of sortedParents) {
    result.push(parent);
    const children = childrenByParent.get(parent.id) ?? [];
    result.push(...children);
  }

  // Add any orphaned children (should not happen)
  for (const entity of entities) {
    if (entity.parentId && !parents.find(p => p.id === entity.parentId)) {
      if (!result.includes(entity)) {
        result.push(entity);
      }
    }
  }

  return result;
}
