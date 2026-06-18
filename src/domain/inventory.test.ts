import { describe, expect, it } from 'vitest';

import { ITEM_CATALOG } from './catalog';
import {
  filterItemsByInventory,
  parseInventoryText,
  parseInventoryTextWithValidation,
} from './inventory';
import { loadPasteFixture } from '../test/fixtures/loadPasteFixture';

describe('inventory', () => {
  it('parses item quantities from pasted text', () => {
    expect(parseInventoryText('Pistol x2\nBasic Costume\nSmoke Grenade (x3)')).toEqual({
      Pistol: 2,
      'Basic Costume': 1,
      'Smoke Grenade': 3,
    });
  });

  it('ignores blank lines and aggregates duplicate entries', () => {
    expect(parseInventoryText('Pistol x2\n\nPistol\n  Pistol (x3)  ')).toEqual({
      Pistol: 6,
    });
  });

  it('limits catalog items to pasted inventory entries case-insensitively', () => {
    const quantities = parseInventoryText('pistol x2\nSMOKE grenade');

    expect(filterItemsByInventory(ITEM_CATALOG, quantities).map((item) => item.id)).toEqual([
      'Pistol',
      'Smoke Grenade',
    ]);
  });

  it('matches inventory entries against item names when IDs differ', () => {
    const quantities = parseInventoryText('Smoke Grenade');

    expect(
      filterItemsByInventory(
        [
          {
            id: 'smoke-grenade',
            name: 'Smoke Grenade',
            slot: 'Gadget',
            capacity: 1,
            effects: { set: {}, alter: {} },
          },
        ],
        quantities,
      ).map((item) => item.id),
    ).toEqual(['smoke-grenade']);
  });

  it('reports unparsed inventory lines when validating against the catalog', () => {
    expect(parseInventoryTextWithValidation('Pistol x2\nUnknown Thing\nSmoke Grenade', ITEM_CATALOG)).toEqual({
      quantities: {
        Pistol: 2,
        'Smoke Grenade': 1,
      },
      invalidLines: ['Unknown Thing'],
    });
  });

  it('parses the inventory paste export into available items', () => {
    expect(parseInventoryTextWithValidation(loadPasteFixture('inventory'), ITEM_CATALOG)).toEqual({
      quantities: {
        'Homemade Costume': 1,
        Taser: 1,
      },
      invalidLines: [],
    });
  });
});
