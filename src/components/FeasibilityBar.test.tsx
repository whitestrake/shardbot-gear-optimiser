import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { FeasibilityBar } from './FeasibilityBar';

describe('FeasibilityBar', () => {
  it('uses a larger hover target for the chevrons', () => {
    const { container } = render(
      <FeasibilityBar
        defaultMin={1}
        defaultMax={20}
        feasibleMin={3}
        feasibleMax={17}
        constraintMin={4}
        constraintMax={15}
        baseValue={9}
        selectedValue={12}
        onConstraintChange={() => undefined}
      />,
    );

    const hitTargets = container.querySelectorAll('.feasibility-chevron-hit-target');
    expect(hitTargets).toHaveLength(2);
    expect(Array.from(hitTargets[0].children).some((child) => child.classList.contains('feasibility-base-chevron'))).toBe(true);
    expect(Array.from(hitTargets[1].children).some((child) => child.classList.contains('feasibility-selected-chevron'))).toBe(true);
  });

  it('keeps the selected chevron tooltip close to the visual chevron despite the larger hit target', async () => {
    const { container } = render(
      <FeasibilityBar
        defaultMin={1}
        defaultMax={20}
        feasibleMin={3}
        feasibleMax={17}
        constraintMin={4}
        constraintMax={15}
        baseValue={9}
        selectedValue={12}
        onConstraintChange={() => undefined}
      />,
    );

    const selectedHitTarget = container.querySelector('.feasibility-selected-wrapper') as HTMLElement;
    selectedHitTarget.getBoundingClientRect = () => ({
      x: 100,
      y: 100,
      width: 32,
      height: 24,
      top: 100,
      right: 132,
      bottom: 124,
      left: 100,
      toJSON: () => undefined,
    });

    fireEvent.mouseEnter(selectedHitTarget);

    await waitFor(() => {
      expect(screen.getByRole('tooltip')).toHaveStyle({ top: '116px' });
    });
  });
});
