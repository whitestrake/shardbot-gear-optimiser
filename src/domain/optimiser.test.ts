import { describe, expect, it } from 'vitest';

import { GAME_RULES } from './rules';
import { optimiseBuilds } from './optimiser';
import type { CatalogItem, CapeState, StatId } from './types';

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
    id: 'low-weapon',
    name: 'Low Weapon',
    slot: 'Weapon',
    capacity: 1,
    effects: { set: {}, alter: { strength: 1 } },
  },
  {
    id: 'high-weapon',
    name: 'High Weapon',
    slot: 'Weapon',
    capacity: 1,
    effects: { set: {}, alter: { strength: 3 } },
  },
  {
    id: 'control-gadget',
    name: 'Control Gadget',
    slot: 'Gadget',
    capacity: 1,
    effects: { set: {}, alter: { control: 3 } },
  },
];

function buildGoals(priority: StatId[], constraints: Parameters<typeof optimiseBuilds>[0]['goals']['constraints']) {
  return {
    priority,
    constraints,
  };
}

describe('optimiseBuilds', () => {
  it('filters strict results by enabled min and max constraints', () => {
    const result = optimiseBuilds({
      cape,
      items,
      rules: GAME_RULES,
      goals: buildGoals(['strength', 'control', 'vitality', 'utility', 'technique'], {
        strength: { enabled: true, min: 6, max: 20 },
        control: { enabled: true, min: 1, max: 8 },
      }),
      includeClosestMisses: false,
    });

    expect(result.rows.every((row) => row.valid)).toBe(true);
    expect(result.rows[0].finalStats.strength).toBe(6);
    expect(result.rows[0].items.map((item) => item.id)).toContain('high-weapon');
    expect(result.rows[0].violations).toEqual([]);
  });

  it('ranks by priority order before total sum', () => {
    const result = optimiseBuilds({
      cape,
      items,
      rules: GAME_RULES,
      goals: buildGoals(['control', 'strength', 'vitality', 'utility', 'technique'], {}),
      includeClosestMisses: false,
    });

    expect(result.rows[0].items.map((item) => item.id)).toContain('control-gadget');
  });

  it('ignores disabled priority stats in the ranking order', () => {
    const rankingItems: CatalogItem[] = [
      ...items,
      {
        id: 'control-rig',
        name: 'Control Rig',
        slot: 'Gadget',
        capacity: 1,
        effects: {
          set: {},
          alter: {
            control: 4,
            vitality: -3,
            utility: -3,
          },
        },
      },
    ];

    const result = optimiseBuilds({
      cape,
      items: rankingItems,
      rules: GAME_RULES,
      goals: buildGoals(['control', 'strength', 'vitality', 'utility', 'technique'], {
        control: { enabled: false, min: 1, max: 20 },
        strength: { enabled: true, min: 6, max: 20 },
      }),
      includeClosestMisses: false,
    });

    expect(result.rows[0].items.map((item) => item.id)).not.toContain('control-rig');
    expect(result.rows[0].finalStats.strength).toBe(6);
    expect(result.rows[0].total).toBeGreaterThan(result.rows[1].total);
  });

  it('computes feasible ranges across all legal rows when unconstrained', () => {
    const result = optimiseBuilds({
      cape,
      items,
      rules: GAME_RULES,
      goals: buildGoals(['strength', 'control', 'vitality', 'utility', 'technique'], {}),
      includeClosestMisses: false,
    });

    expect(result.feasibleRanges.strength).toEqual({ min: 3, max: 6 });
    expect(result.feasibleRanges.control).toEqual({ min: 6, max: 9 });
  });

  it('computes feasible ranges from valid rows when constraints are enabled', () => {
    const result = optimiseBuilds({
      cape,
      items,
      rules: GAME_RULES,
      goals: buildGoals(['strength', 'control', 'vitality', 'utility', 'technique'], {
        strength: { enabled: true, min: 6, max: 20 },
      }),
      includeClosestMisses: true,
    });

    expect(result.rows.some((row) => row.valid)).toBe(true);
    expect(result.feasibleRanges.strength).toEqual({ min: 6, max: 6 });
    expect(result.feasibleRanges.control).toEqual({ min: 6, max: 9 });
  });

  it('falls back to all legal rows when no row satisfies the constraints', () => {
    const result = optimiseBuilds({
      cape,
      items,
      rules: GAME_RULES,
      goals: buildGoals(['strength', 'control', 'vitality', 'utility', 'technique'], {
        strength: { enabled: true, min: 99, max: 120 },
      }),
      includeClosestMisses: true,
    });

    expect(result.rows.every((row) => !row.valid)).toBe(true);
    expect(result.feasibleRanges.strength).toEqual({ min: 3, max: 6 });
  });

  it('returns closest misses when no build can satisfy the minimum', () => {
    const result = optimiseBuilds({
      cape,
      items,
      rules: GAME_RULES,
      goals: buildGoals(['strength', 'control', 'vitality', 'utility', 'technique'], {
        strength: { enabled: true, min: 99, max: 120 },
      }),
      includeClosestMisses: true,
    });

    expect(result.rows[0].valid).toBe(false);
    expect(result.rows[0].violations).toEqual(['Strength is 93 below minimum']);
  });
});
