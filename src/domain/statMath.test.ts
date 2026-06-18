import { describe, expect, it } from 'vitest';

import { GAME_RULES } from './rules';
import { applyItemsToStats } from './statMath';
import type { CatalogItem, StatBlock } from './types';

const baseStats: StatBlock = {
  strength: 3,
  vitality: 4,
  utility: 5,
  control: 6,
  technique: 7,
};

describe('applyItemsToStats', () => {
  it('applies setters before modifiers', () => {
    const items: CatalogItem[] = [
      {
        id: 'weapon',
        name: 'Weapon',
        slot: 'Weapon',
        capacity: 1,
        effects: {
          set: { strength: 4 },
          alter: { strength: 2 },
        },
      },
    ];

    expect(applyItemsToStats(baseStats, items, GAME_RULES).strength).toBe(6);
  });

  it('uses later slot setters to overwrite earlier slot setters', () => {
    const items: CatalogItem[] = [
      {
        id: 'weapon',
        name: 'Weapon',
        slot: 'Weapon',
        capacity: 1,
        effects: {
          set: { strength: 4 },
          alter: {},
        },
      },
      {
        id: 'costume',
        name: 'Costume',
        slot: 'Costume',
        capacity: 1,
        effects: {
          set: { strength: 8 },
          alter: {},
        },
      },
    ];

    expect(applyItemsToStats(baseStats, items, GAME_RULES).strength).toBe(8);
  });

  it('clamps modified stats to the floor', () => {
    const items: CatalogItem[] = [
      {
        id: 'gadget',
        name: 'Gadget',
        slot: 'Gadget',
        capacity: 1,
        effects: {
          set: {},
          alter: { control: -99 },
        },
      },
    ];

    expect(applyItemsToStats(baseStats, items, GAME_RULES).control).toBe(1);
  });
});
