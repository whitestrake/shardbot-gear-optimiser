import { GAME_RULES } from './rules';
import { STAT_IDS } from './stats';
import type { CapeState, CatalogItem, GameRules, ItemSlot } from './types';

export interface ItemCombination {
  items: CatalogItem[];
  capacityUsed: number;
}

export function getCapacity(cape: CapeState, rules: GameRules): number {
  return rules.baseCapacity + (cape.hasPrepper ? rules.prepperCapacityBonus : 0);
}

function isEligibleForCape(cape: CapeState, item: CatalogItem): boolean {
  const restrictions = item.restrictions;
  if (!restrictions) {
    return true;
  }

  if (restrictions.classes && !restrictions.classes.includes(cape.capeClass as never)) {
    return false;
  }

  if (restrictions.subclasses) {
    const subclassKey = `${cape.capeClass}:${cape.subclass}`;
    if (!restrictions.subclasses.includes(subclassKey as never)) {
      return false;
    }
  }

  return true;
}

export function getEligibleItems(cape: CapeState, items: CatalogItem[]): CatalogItem[] {
  return items.filter((item) => isEligibleForCape(cape, item));
}

function buildSlotMap(items: CatalogItem[]): Map<ItemSlot, CatalogItem[]> {
  const slotMap = new Map<ItemSlot, CatalogItem[]>();
  for (const item of items) {
    const bucket = slotMap.get(item.slot) ?? [];
    bucket.push(item);
    slotMap.set(item.slot, bucket);
  }
  return slotMap;
}

export function getItemCombinations(
  cape: CapeState,
  items: CatalogItem[],
  rules: GameRules = GAME_RULES,
): ItemCombination[] {
  const eligibleItems = getEligibleItems(cape, items);
  const slotMap = buildSlotMap(eligibleItems);
  const combinations: ItemCombination[] = [];

  const walk = (slotIndex: number, selected: CatalogItem[], capacityUsed: number): void => {
    if (slotIndex >= rules.slotOrder.length) {
      if (capacityUsed <= getCapacity(cape, rules)) {
        combinations.push({ items: [...selected], capacityUsed });
      }
      return;
    }

    const slot = rules.slotOrder[slotIndex];
    walk(slotIndex + 1, selected, capacityUsed);

    for (const item of slotMap.get(slot) ?? []) {
      const nextCapacity = capacityUsed + item.capacity;
      if (nextCapacity > getCapacity(cape, rules)) {
        continue;
      }
      selected.push(item);
      walk(slotIndex + 1, selected, nextCapacity);
      selected.pop();
    }
  };

  walk(0, [], 0);
  return combinations;
}
