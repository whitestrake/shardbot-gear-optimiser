import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Modal } from './Modal';

describe('Modal', () => {
  it('renders its dialog outside the render container', () => {
    const { container } = render(
      <Modal title="Inventory text needs attention" titleId="inventory-modal-title" onClose={() => undefined}>
        <p>Fix the pasted inventory lines.</p>
      </Modal>,
    );

    expect(container.querySelector('[role="dialog"]')).toBeNull();
    expect(document.body.querySelector('[role="dialog"]')).toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: /inventory text needs attention/i })).toBeInTheDocument();
  });
});
