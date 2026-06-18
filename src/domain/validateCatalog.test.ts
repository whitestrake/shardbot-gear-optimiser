import { describe, expect, it } from 'vitest';
import { CLASS_OPTIONS, SUBCLASS_OPTIONS_BY_CLASS } from './classes';
import { ITEM_CATALOG } from './catalog';
import { GAME_RULES } from './rules';
import { STAT_IDS } from './stats';
import { validateCatalog } from './validateCatalog';
import type { CatalogItem } from './types';

function asCatalogItems(items: unknown[]): CatalogItem[] {
  return items as CatalogItem[];
}

describe('validateCatalog', () => {
  it('accepts the curated catalog', () => {
    expect(
      validateCatalog({
        items: ITEM_CATALOG,
        stats: STAT_IDS,
        slots: GAME_RULES.slotOrder,
        classes: CLASS_OPTIONS,
        subclassesByClass: SUBCLASS_OPTIONS_BY_CLASS,
      }),
    ).toEqual([]);
  });

  it('contains the player-equippable handbook items', () => {
    expect(ITEM_CATALOG).toHaveLength(40);
    expect(ITEM_CATALOG.map((item) => item.id)).not.toContain('Foam Launcher');
  });

  it('matches the handbook item slots, capacities, and modifiers', () => {
    expect(
      ITEM_CATALOG.map((item) => ({
        id: item.id,
        slot: item.slot,
        capacity: item.capacity,
        set: item.effects.set,
        alter: item.effects.alter,
      })),
    ).toEqual([
      { id: 'Knife', slot: 'Weapon', capacity: 0, set: {}, alter: { strength: 1, control: -1 } },
      { id: 'Mace', slot: 'Weapon', capacity: 0, set: {}, alter: { strength: 1, utility: -1 } },
      { id: 'Taser', slot: 'Weapon', capacity: 0, set: {}, alter: { technique: 1, control: -1 } },
      { id: 'Helmet', slot: 'Costume', capacity: 0, set: {}, alter: { vitality: 1, technique: -1 } },
      { id: 'Lucky Charm', slot: 'Gadget', capacity: 0, set: { utility: 3, control: 1 }, alter: {} },
      { id: 'Sword', slot: 'Weapon', capacity: 1, set: {}, alter: { strength: 1 } },
      { id: 'Pistol', slot: 'Weapon', capacity: 1, set: { strength: 4 }, alter: { control: 1 } },
      { id: 'Spear', slot: 'Weapon', capacity: 1, set: {}, alter: { control: 1 } },
      { id: 'Baseball Bat', slot: 'Weapon', capacity: 1, set: {}, alter: { technique: 1 } },
      { id: 'Crossbow', slot: 'Weapon', capacity: 1, set: {}, alter: { control: 2, technique: -1 } },
      {
        id: 'Brass Knuckles',
        slot: 'Weapon',
        capacity: 1,
        set: {},
        alter: { strength: 1, technique: 1, vitality: -1 },
      },
      { id: 'Homemade Costume', slot: 'Costume', capacity: 1, set: {}, alter: { vitality: 1, utility: -1 } },
      { id: 'Basic Costume', slot: 'Costume', capacity: 1, set: {}, alter: { vitality: 2 } },
      { id: 'Heavy Costume', slot: 'Costume', capacity: 1, set: {}, alter: { vitality: 3, technique: -1 } },
      { id: 'Light Costume', slot: 'Costume', capacity: 1, set: {}, alter: { vitality: 1, control: 1 } },
      { id: 'Smoke Grenade', slot: 'Gadget', capacity: 1, set: { control: 3 }, alter: {} },
      { id: 'Pipe Bomb', slot: 'Gadget', capacity: 1, set: {}, alter: { control: 1 } },
      { id: 'Grappling Hook', slot: 'Gadget', capacity: 1, set: {}, alter: { control: 2, vitality: -1 } },
      { id: 'Utility Belt', slot: 'Gadget', capacity: 1, set: {}, alter: { utility: 1, strength: -1 } },
      { id: 'Molotov', slot: 'Gadget', capacity: 1, set: {}, alter: { strength: 2, vitality: -1 } },
      { id: 'Shield', slot: 'Gadget', capacity: 1, set: {}, alter: { vitality: 1 } },
      { id: 'Laser Gun', slot: 'Weapon', capacity: 2, set: {}, alter: { strength: 1, control: 1 } },
      { id: 'Grenade Launcher', slot: 'Weapon', capacity: 2, set: { strength: 6 }, alter: { vitality: -2 } },
      { id: 'Flamethrower', slot: 'Weapon', capacity: 2, set: {}, alter: { strength: 3, technique: -1 } },
      { id: 'Sniper Rifle', slot: 'Weapon', capacity: 2, set: { strength: 5 }, alter: { control: -2 } },
      { id: 'Assault Rifle', slot: 'Weapon', capacity: 2, set: { strength: 4 }, alter: { control: 1 } },
      { id: 'Buster Sword', slot: 'Weapon', capacity: 2, set: {}, alter: { strength: 2 } },
      { id: 'Plasma Blade', slot: 'Weapon', capacity: 2, set: {}, alter: { strength: 3, vitality: -1 } },
      { id: 'Personalized Costume', slot: 'Costume', capacity: 2, set: {}, alter: { utility: 1, vitality: 1 } },
      { id: 'Steel Plate', slot: 'Costume', capacity: 2, set: {}, alter: { vitality: 4, control: -1 } },
      {
        id: 'Power Armor',
        slot: 'Costume',
        capacity: 2,
        set: {},
        alter: { strength: 2, vitality: 2, control: -1, technique: -1 },
      },
      { id: 'Jetpack', slot: 'Gadget', capacity: 2, set: {}, alter: { control: 2 } },
      {
        id: 'Enhancer Drugs',
        slot: 'Gadget',
        capacity: 2,
        set: {},
        alter: { strength: 1, vitality: 3, control: 2, utility: -2, technique: -1 },
      },
      { id: 'Kevlar Covering', slot: 'Gadget', capacity: 2, set: {}, alter: { vitality: 2 } },
      { id: 'Recon Drone', slot: 'Gadget', capacity: 2, set: {}, alter: { utility: 2, control: -1 } },
      { id: 'Nanofilament Blade', slot: 'Weapon', capacity: 3, set: { control: 4 }, alter: { strength: 4 } },
      {
        id: 'Mecha Suit',
        slot: 'Costume',
        capacity: 3,
        set: { strength: 5, vitality: 9 },
        alter: { control: 1, technique: -1 },
      },
      { id: 'Titan Armor', slot: 'Costume', capacity: 3, set: {}, alter: { vitality: 6 } },
      {
        id: 'Combat Analyzer AI',
        slot: 'Gadget',
        capacity: 3,
        set: { technique: 5 },
        alter: { control: -2, utility: 3 },
      },
      { id: 'Precog Forecast', slot: 'Gadget', capacity: 3, set: {}, alter: { control: 4 } },
    ]);
  });

  it('reports duplicate item ids', () => {
    const duplicateCatalog = asCatalogItems([
      ITEM_CATALOG[0],
      { ...ITEM_CATALOG[0], name: `${ITEM_CATALOG[0].name} Duplicate` },
    ]);

    expect(
      validateCatalog({
        items: duplicateCatalog,
        stats: STAT_IDS,
        slots: GAME_RULES.slotOrder,
        classes: CLASS_OPTIONS,
        subclassesByClass: SUBCLASS_OPTIONS_BY_CLASS,
      }),
    ).toContain(`Duplicate item id: ${ITEM_CATALOG[0].id}`);
  });

  it('reports invalid set and alter stat ids', () => {
    const badStatsCatalog = asCatalogItems([
      {
        ...ITEM_CATALOG[0],
        id: 'Bad Stat Item',
        effects: {
          set: { imaginary: 1 },
          alter: { mystery: -1 },
        },
      },
    ]);

    expect(
      validateCatalog({
        items: badStatsCatalog,
        stats: STAT_IDS,
        slots: GAME_RULES.slotOrder,
        classes: CLASS_OPTIONS,
        subclassesByClass: SUBCLASS_OPTIONS_BY_CLASS,
      }),
    ).toEqual([
      'Bad Stat Item uses invalid set stat: imaginary',
      'Bad Stat Item uses invalid alter stat: mystery',
    ]);
  });

  it('reports invalid restrictions', () => {
    const badRestrictionsCatalog = asCatalogItems([
      {
        ...ITEM_CATALOG[0],
        id: 'Bad Restrictions',
        slot: 'Trinket',
        capacity: -1,
        restrictions: {
          classes: ['Wizard'],
          subclasses: ['Blaster:Raycaster'],
        },
      },
    ]);

    expect(
      validateCatalog({
        items: badRestrictionsCatalog,
        stats: STAT_IDS,
        slots: GAME_RULES.slotOrder,
        classes: CLASS_OPTIONS,
        subclassesByClass: SUBCLASS_OPTIONS_BY_CLASS,
      }),
    ).toEqual([
      'Bad Restrictions uses invalid slot: Trinket',
      'Bad Restrictions has invalid capacity: -1',
      'Bad Restrictions restricts to invalid class: Wizard',
      'Bad Restrictions restricts to invalid subclass: Blaster:Raycaster',
    ]);
  });

  it('reports capacity values outside handbook bounds', () => {
    const badCapacityCatalog = asCatalogItems([{ ...ITEM_CATALOG[0], id: 'Bad Capacity', capacity: 4 }]);

    expect(
      validateCatalog({
        items: badCapacityCatalog,
        stats: STAT_IDS,
        slots: GAME_RULES.slotOrder,
        classes: CLASS_OPTIONS,
        subclassesByClass: SUBCLASS_OPTIONS_BY_CLASS,
      }),
    ).toContain('Bad Capacity has invalid capacity: 4');
  });

  it('reports missing weapon class restrictions', () => {
    const missingRestrictionWeapon = asCatalogItems([{ ...ITEM_CATALOG[0], id: 'Bad Weapon', slot: 'Weapon', restrictions: { classes: [] } }]);

    expect(
      validateCatalog({
        items: missingRestrictionWeapon,
        stats: STAT_IDS,
        slots: GAME_RULES.slotOrder,
        classes: CLASS_OPTIONS,
        subclassesByClass: SUBCLASS_OPTIONS_BY_CLASS,
      }),
    ).toContain('Bad Weapon is a Weapon but has no class restrictions');
  });
});
