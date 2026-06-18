import type { CatalogItem, CapeClass, ItemSlot, StatId } from './types';

export interface ValidateCatalogInput {
  items: CatalogItem[];
  stats: readonly StatId[];
  slots: readonly ItemSlot[];
  classes: readonly CapeClass[];
  subclassesByClass: Record<CapeClass, readonly string[]>;
}

export function validateCatalog(input: ValidateCatalogInput): string[] {
  const errors: string[] = [];
  const seenIds = new Set<string>();
  const statIdSet = new Set<string>(input.stats);
  const slotSet = new Set(input.slots);
  const classSet = new Set(input.classes);
  const subclassSet = new Set<string>(
    input.classes.flatMap((capeClass) =>
      input.subclassesByClass[capeClass].map((subclass) => `${capeClass}:${subclass}`),
    ),
  );

  for (const item of input.items) {
    if (seenIds.has(item.id)) {
      errors.push(`Duplicate item id: ${item.id}`);
    } else {
      seenIds.add(item.id);
    }

    if (!slotSet.has(item.slot)) {
      errors.push(`${item.id} uses invalid slot: ${item.slot}`);
    }

    if (!Number.isInteger(item.capacity) || item.capacity < 0 || item.capacity > 3) {
      errors.push(`${item.id} has invalid capacity: ${item.capacity}`);
    }

    for (const [statId, value] of Object.entries(item.effects.set ?? {})) {
      if (!statIdSet.has(statId)) {
        errors.push(`${item.id} uses invalid set stat: ${statId}`);
      } else if (typeof value === 'number' && value < 1) {
        errors.push(`${item.id} has invalid set value for ${statId}: ${value}`);
      }
    }

    for (const statId of Object.keys(item.effects.alter ?? {})) {
      if (!statIdSet.has(statId)) {
        errors.push(`${item.id} uses invalid alter stat: ${statId}`);
      }
    }

    for (const capeClass of item.restrictions?.classes ?? []) {
      if (!classSet.has(capeClass)) {
        errors.push(`${item.id} restricts to invalid class: ${capeClass}`);
      }
    }

    if (item.slot === 'Weapon' && (!item.restrictions?.classes || item.restrictions.classes.length === 0)) {
      errors.push(`${item.id} is a Weapon but has no class restrictions`);
    }

    for (const subclass of item.restrictions?.subclasses ?? []) {
      if (!subclassSet.has(subclass)) {
        errors.push(`${item.id} restricts to invalid subclass: ${subclass}`);
      }
    }
  }

  return errors;
}
