import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { OptimisationRow } from '../domain/optimiser';
import type { CatalogItem } from '../domain/types';
import { ResultsMatrix } from './ResultsMatrix';

const weapon: CatalogItem = {
  id: 'pistol',
  name: 'Pistol',
  slot: 'Weapon',
  capacity: 1,
  effects: { set: {}, alter: { strength: 1 } },
};

const costume: CatalogItem = {
  id: 'armor',
  name: 'Armor',
  slot: 'Costume',
  capacity: 2,
  effects: { set: {}, alter: { vitality: 1 } },
};

const gadget: CatalogItem = {
  id: 'radio',
  name: 'Radio',
  slot: 'Gadget',
  capacity: 3,
  effects: { set: {}, alter: { utility: 1 } },
};

const row: OptimisationRow = {
  items: [weapon, costume, gadget],
  capacityUsed: 6,
  finalStats: {
    strength: 1,
    vitality: 2,
    utility: 3,
    control: 4,
    technique: 5,
  },
  total: 15,
  waste: 0,
  valid: true,
  violations: [],
  missDistance: 0,
};

describe('ResultsMatrix', () => {
  it('renders capacity tooltips underneath the capacity cell', async () => {
    const { container } = render(
      <ResultsMatrix
        rows={[row]}
        selectedRowKey={null}
        onSelect={() => undefined}
      />,
    );

    const capacityTrigger = container.querySelector('.capacity-cell .build-card-cell-content-wrapper') as HTMLElement;
    capacityTrigger.getBoundingClientRect = () => ({
      x: 100,
      y: 100,
      width: 100,
      height: 24,
      top: 100,
      right: 200,
      bottom: 124,
      left: 100,
      toJSON: () => undefined,
    });

    fireEvent.mouseEnter(capacityTrigger);

    await waitFor(() => {
      expect(screen.getByRole('tooltip')).toHaveClass('position-bottom');
    });
  });

  it('renders overflowing gadget tooltips underneath the gadget cell', async () => {
    const { container } = render(
      <ResultsMatrix
        rows={[row]}
        selectedRowKey={null}
        onSelect={() => undefined}
      />,
    );

    const gadgetTrigger = container.querySelectorAll('.build-card-grid-cell .build-card-cell-content-wrapper')[2] as HTMLElement;
    const gadgetName = gadgetTrigger.querySelector('.build-card-item-name') as HTMLElement;

    Object.defineProperties(gadgetName, {
      clientWidth: { configurable: true, value: 40 },
      scrollWidth: { configurable: true, value: 120 },
      clientHeight: { configurable: true, value: 20 },
      scrollHeight: { configurable: true, value: 20 },
    });
    gadgetTrigger.getBoundingClientRect = () => ({
      x: 100,
      y: 100,
      width: 100,
      height: 24,
      top: 100,
      right: 200,
      bottom: 124,
      left: 100,
      toJSON: () => undefined,
    });

    fireEvent.mouseEnter(gadgetTrigger);

    await waitFor(() => {
      expect(screen.getByRole('tooltip')).toHaveClass('position-bottom');
    });
  });

  it('does not render gadget tooltips when the gadget text fits', () => {
    const { container } = render(
      <ResultsMatrix
        rows={[row]}
        selectedRowKey={null}
        onSelect={() => undefined}
      />,
    );

    const gadgetTrigger = container.querySelectorAll('.build-card-grid-cell .build-card-cell-content-wrapper')[2] as HTMLElement;
    const gadgetTargets = gadgetTrigger.querySelectorAll('.build-card-item-name, .build-card-item-effects, .build-card-item-empty');

    gadgetTargets.forEach((target) => {
      Object.defineProperties(target, {
        clientWidth: { configurable: true, value: 120 },
        scrollWidth: { configurable: true, value: 120 },
        clientHeight: { configurable: true, value: 20 },
        scrollHeight: { configurable: true, value: 20 },
      });
    });

    fireEvent.mouseEnter(gadgetTrigger);

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });
});
