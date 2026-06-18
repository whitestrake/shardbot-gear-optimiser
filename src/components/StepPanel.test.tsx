import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { StepPanel } from './StepPanel';

describe('StepPanel', () => {
  it('renders a stable pane shell with explicit pane state', () => {
    render(
      <StepPanel pane="input" step={1} title="Your Cape" collapsed onCollapsedClick={() => undefined}>
        <label>
          Cape
          <textarea defaultValue="sample cape" />
        </label>
      </StepPanel>,
    );

    const panel = screen.getByLabelText('Your Cape');
    expect(panel).toHaveClass('step-panel');
    expect(panel).toHaveAttribute('data-pane', 'input');
    expect(panel).toHaveAttribute('data-collapsed', 'true');
  });

  it('keeps the body mounted while collapsed and hides it from assistive tech', () => {
    render(
      <StepPanel pane="output" step={3} title="Optimised Builds" collapsed onCollapsedClick={() => undefined}>
        <button type="button">Select build: Taser</button>
      </StepPanel>,
    );

    expect(screen.getByRole('button', { name: /expand optimised builds/i })).toBeInTheDocument();
    expect(screen.getByText('Select build: Taser')).toBeInTheDocument();
    expect(screen.getByTestId('step-panel-body')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByTestId('step-panel-body')).toHaveAttribute('inert');
  });

  it('exposes the expanded body and removes the collapsed rail from tab order', () => {
    const { container } = render(
      <StepPanel pane="goals" step={2} title="Stat Prioritisation">
        <button type="button">Move Strength up</button>
      </StepPanel>,
    );

    const rail = container.querySelector('.step-panel-collapsed-trigger');
    expect(rail).toBeInTheDocument();
    expect(rail).toHaveAttribute('tabindex', '-1');
    expect(rail).toBeDisabled();
    expect(screen.getByTestId('step-panel-body')).toHaveAttribute('aria-hidden', 'false');
    expect(screen.getByTestId('step-panel-body')).not.toHaveAttribute('inert');
    expect(screen.getByRole('heading', { name: /stat prioritisation/i })).toBeInTheDocument();
  });

  it('moves focus to the rail trigger when a focused body collapses', () => {
    const { rerender } = render(
      <StepPanel pane="input" step={1} title="Your Cape" onCollapsedClick={() => undefined}>
        <button type="button">Focused child</button>
      </StepPanel>,
    );

    screen.getByRole('button', { name: 'Focused child' }).focus();
    expect(screen.getByRole('button', { name: 'Focused child' })).toHaveFocus();

    rerender(
      <StepPanel pane="input" step={1} title="Your Cape" collapsed onCollapsedClick={() => undefined}>
        <button type="button">Focused child</button>
      </StepPanel>,
    );

    expect(screen.getByRole('button', { name: /expand your cape/i })).toHaveFocus();
  });

  it('renders a description paragraph when provided', () => {
    render(
      <StepPanel pane="input" step={1} title="Your Cape" description="Step description here">
        <div>Content</div>
      </StepPanel>,
    );

    expect(screen.getByText('Step description here')).toBeInTheDocument();
    expect(screen.getByText('Step description here')).toHaveClass('step-panel-description');
  });
});
