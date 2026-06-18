import { STAT_IDS } from './stats';
import type { CatalogItem, GameRules, StatBlock } from './types';

export function applyItemsToStats(
  baseStats: StatBlock,
  items: CatalogItem[],
  rules: GameRules,
): StatBlock {
  const finalStats: StatBlock = { ...baseStats };
  const sortedItems = [...items].sort(
    (left, right) => rules.slotOrder.indexOf(left.slot) - rules.slotOrder.indexOf(right.slot),
  );

  for (const item of sortedItems) {
    for (const statId of STAT_IDS) {
      const value = item.effects.set[statId];
      if (typeof value === 'number') {
        finalStats[statId] = Math.max(rules.statFloor, value);
      }
    }
  }

  for (const item of sortedItems) {
    for (const statId of STAT_IDS) {
      const value = item.effects.alter[statId];
      if (typeof value === 'number') {
        finalStats[statId] = Math.max(rules.statFloor, finalStats[statId] + value);
      }
    }
  }

  return finalStats;
}
