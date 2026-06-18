import '@testing-library/jest-dom/vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { Tooltip } from './Tooltip';

describe('Tooltip', () => {
  it('renders tooltip content through the body when the trigger is hovered', async () => {
    const user = userEvent.setup();

    const { container } = render(
      <Tooltip content="Weapon: +2 STR">
        <button type="button">Weapon</button>
      </Tooltip>,
    );

    await user.hover(screen.getByRole('button', { name: 'Weapon' }));

    expect(container.querySelector('[role="tooltip"]')).toBeNull();
    expect(document.body.querySelector('[role="tooltip"]')).toBeInTheDocument();
    expect(screen.getByRole('tooltip')).toHaveTextContent('Weapon: +2 STR');
  });

  it('can prefer bottom placement', async () => {
    const user = userEvent.setup();

    const { container } = render(
      <Tooltip content="Geared 12 (+3)" preferredPlacement="bottom">
        <button type="button">Geared marker</button>
      </Tooltip>,
    );

    const trigger = container.firstElementChild as HTMLElement;
    trigger.getBoundingClientRect = () => ({
      x: 100,
      y: 100,
      width: 20,
      height: 20,
      top: 100,
      right: 120,
      bottom: 120,
      left: 100,
      toJSON: () => undefined,
    });

    await user.hover(screen.getByRole('button', { name: 'Geared marker' }));

    await waitFor(() => {
      expect(screen.getByRole('tooltip')).toHaveClass('position-bottom');
    });
  });

  it('marks measured tooltips visible so placement CSS can animate outwards', async () => {
    const user = userEvent.setup();

    render(
      <Tooltip content="Grenade Launcher (+4 STR)">
        <button type="button">Grenade Launcher</button>
      </Tooltip>,
    );

    await user.hover(screen.getByRole('button', { name: 'Grenade Launcher' }));

    await waitFor(() => {
      expect(screen.getByRole('tooltip')).toHaveClass('portal-tooltip-visible');
    });
  });

  it('marks bottom tooltips with the bottom placement class for downward animation', async () => {
    const user = userEvent.setup();

    const { container } = render(
      <Tooltip content="Capacity breakdown" preferredPlacement="bottom">
        <button type="button">Capacity</button>
      </Tooltip>,
    );

    const trigger = container.firstElementChild as HTMLElement;
    trigger.getBoundingClientRect = () => ({
      x: 100,
      y: 100,
      width: 80,
      height: 20,
      top: 100,
      right: 180,
      bottom: 120,
      left: 100,
      toJSON: () => undefined,
    });

    await user.hover(screen.getByRole('button', { name: 'Capacity' }));

    await waitFor(() => {
      expect(screen.getByRole('tooltip')).toHaveClass('position-bottom', 'portal-tooltip-visible');
    });
  });

  it('does not open an overflow-gated tooltip when the measured content fits', async () => {
    const user = userEvent.setup();

    render(
      <Tooltip content="Pistol" showOnOverflowOnly overflowSelector=".measured-text">
        <span className="measured-text">Pistol</span>
      </Tooltip>,
    );

    const measuredText = screen.getByText('Pistol');
    Object.defineProperties(measuredText, {
      clientWidth: { configurable: true, value: 80 },
      scrollWidth: { configurable: true, value: 80 },
      clientHeight: { configurable: true, value: 20 },
      scrollHeight: { configurable: true, value: 20 },
    });

    await user.hover(measuredText);

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('does not open an overflow-gated tooltip for tiny measurement deltas', async () => {
    const user = userEvent.setup();

    render(
      <Tooltip content="Radio" showOnOverflowOnly overflowSelector=".measured-text">
        <span className="measured-text">Radio</span>
      </Tooltip>,
    );

    const measuredText = screen.getByText('Radio');
    Object.defineProperties(measuredText, {
      clientWidth: { configurable: true, value: 80 },
      scrollWidth: { configurable: true, value: 81 },
      clientHeight: { configurable: true, value: 20 },
      scrollHeight: { configurable: true, value: 20 },
    });

    await user.hover(measuredText);

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('opens an overflow-gated tooltip when the measured content is clipped', async () => {
    const user = userEvent.setup();

    render(
      <Tooltip content="Very Long Weapon Name" showOnOverflowOnly overflowSelector=".measured-text">
        <span className="measured-text">Very Long Weapon Name</span>
      </Tooltip>,
    );

    const measuredText = screen.getByText('Very Long Weapon Name');
    Object.defineProperties(measuredText, {
      clientWidth: { configurable: true, value: 80 },
      scrollWidth: { configurable: true, value: 140 },
      clientHeight: { configurable: true, value: 20 },
      scrollHeight: { configurable: true, value: 20 },
    });

    await user.hover(measuredText);

    await waitFor(() => {
      expect(screen.getByRole('tooltip')).toHaveTextContent('Very Long Weapon Name');
    });
  });
});
