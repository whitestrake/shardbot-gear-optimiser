import { describe, expect, it } from 'vitest';

import { WEAPON_ACCESS_CLASSES } from './classes';
import { GAME_RULES } from './rules';
import { getCapacity, getEligibleItems, getItemCombinations } from './itemRules';
import type { CapeState, CatalogItem } from './types';

const cape: CapeState = {
  capeClass: 'Tinker',
  subclass: 'Combat',
  hasPrepper: false,
  stats: {
    strength: 3,
    vitality: 4,
    utility: 5,
    control: 6,
    technique: 7,
  },
};

const items: CatalogItem[] = [
  {
    id: 'weapon',
    name: 'Weapon',
    slot: 'Weapon',
    capacity: 1,
    effects: { set: {}, alter: {} },
    restrictions: {
      classes: WEAPON_ACCESS_CLASSES,
    },
  },
  {
    id: 'costume',
    name: 'Costume',
    slot: 'Costume',
    capacity: 1,
    effects: { set: {}, alter: {} },
  },
  {
    id: 'gadget',
    name: 'Gadget',
    slot: 'Gadget',
    capacity: 1,
    effects: { set: {}, alter: {} },
  },
  {
    id: 'brute-only',
    name: 'Brute Only',
    slot: 'Weapon',
    capacity: 1,
    effects: { set: {}, alter: {} },
    restrictions: {
      classes: ['Brute'],
    },
  },
];

describe('item rules', () => {
  it('calculates capacity with and without prepper bonus', () => {
    expect(getCapacity(cape, GAME_RULES)).toBe(3);
    expect(getCapacity({ ...cape, hasPrepper: true }, GAME_RULES)).toBe(4);
  });

  it('filters out ineligible items', () => {
    expect(getEligibleItems(cape, items).map((item) => item.id)).toEqual([
      'weapon',
      'costume',
      'gadget',
    ]);
  });

  it('blocks weapons for handbook-restricted classes', () => {
    const blasterCape: CapeState = {
      ...cape,
      capeClass: 'Blaster',
      subclass: 'Nuker',
    };

    expect(getEligibleItems(blasterCape, items).map((item) => item.id)).toEqual([
      'costume',
      'gadget',
    ]);
  });

  it('generates combinations across slots within capacity', () => {
    const combinations = getItemCombinations(cape, items.slice(0, 3), GAME_RULES);

    expect(combinations).toHaveLength(8);
    expect(combinations).toEqual(
      expect.arrayContaining([
        { items: [], capacityUsed: 0 },
        {
          items: [items[0], items[1], items[2]],
          capacityUsed: 3,
        },
      ]),
    );
  });
});
