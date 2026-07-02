import '@testing-library/jest-dom/vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { App } from './App';
import { loadPasteFixture } from './test/fixtures/loadPasteFixture';

const DEFAULT_VIEWPORT_WIDTH = 1400;

beforeEach(() => {
  setViewportWidth(DEFAULT_VIEWPORT_WIDTH);
});

describe('App', () => {
  it('renders input, goals, and output steps', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: /your cape/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /stat prioritisation/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /optimised builds/i })).toBeInTheDocument();
  });

  it('defaults to brute and its first subclass', () => {
    render(<App />);

    expect(screen.getByLabelText(/^class$/i)).toHaveValue('Brute');
    expect(screen.getByLabelText(/^subclass$/i)).toHaveValue('Negation');
    expect(screen.getByText(/showing top/i)).toBeInTheDocument();
  });

  it('lets pasted cape text populate editable fields', async () => {
    render(<App />);

    await commitField(
      screen.getByLabelText(/^cape$/i),
      'Alias: Meridian\nClass: Tinker: Combat\nStrength: 3 | Vitality: 4 | Utility: 6 | Control: 5 | Technique: 5\nFeats: Prepper',
    );

    expect(screen.getByLabelText(/^class$/i)).toHaveValue('Tinker');
    expect(screen.getByLabelText(/^subclass$/i)).toHaveValue('Combat');
    expect(screen.getByLabelText(/prepper/i)).toBeChecked();
  });

  it('shows inventory paste guidance and keeps the field editable', () => {
    render(<App />);

    const inventoryPaste = screen.getByLabelText(/^inventory$/i);

    expect(inventoryPaste).toHaveAttribute(
      'placeholder',
      'Paste /inventory to limit results to what you have available',
    );
  });

  it('selects the full paste text when the cape or inventory box is clicked', async () => {
    render(<App />);

    const capePaste = screen.getByLabelText(/^cape$/i) as HTMLTextAreaElement;
    const inventoryPaste = screen.getByLabelText(/^inventory$/i) as HTMLTextAreaElement;

    fireEvent.change(capePaste, { target: { value: 'cape text' } });
    capePaste.focus();
    expect(capePaste).toHaveFocus();
    expect(capePaste.selectionStart).toBe(0);
    expect(capePaste.selectionEnd).toBe(capePaste.value.length);

    fireEvent.change(inventoryPaste, { target: { value: 'inventory text' } });
    inventoryPaste.focus();
    expect(inventoryPaste).toHaveFocus();
    expect(inventoryPaste.selectionStart).toBe(0);
    expect(inventoryPaste.selectionEnd).toBe(inventoryPaste.value.length);
  });

  it('renders draggable priority handles and interactive goal inputs', async () => {
    const user = userEvent.setup();
    render(<App />);
    await chooseCapeType(user);

    expect(screen.getAllByRole('button', { name: /drag .* priority/i })).toHaveLength(5);

    const minInput = screen.getAllByLabelText(/^min$/i)[0];
    fireEvent.change(minInput, { target: { value: '6' } });

    expect(minInput).toHaveValue('6');
  });

  it('normalizes base stat inputs when committed', async () => {
    render(<App />);

    const strengthInput = screen.getByLabelText(/^strength$/i);
    fireEvent.change(strengthInput, { target: { value: '04' } });

    expect(strengthInput).toHaveValue('04');

    fireEvent.blur(strengthInput);

    expect(strengthInput).toHaveValue('4');
  });

  it('limits result builds after a valid inventory paste is committed', async () => {
    const user = userEvent.setup();
    render(<App />);
    await chooseCapeType(user);

    expect(screen.getAllByRole('button', { name: /select build: grenade launcher/i }).length).toBeGreaterThan(0);

    const inventoryPaste = screen.getByLabelText(/^inventory$/i);
    await commitField(inventoryPaste, 'Pistol');

    expect(screen.queryByRole('button', { name: /select build: grenade launcher/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /select build: pistol$/i })).toBeInTheDocument();
  });

  it('opens a modal when inventory lines do not parse', async () => {
    const user = userEvent.setup();
    render(<App />);
    await chooseCapeType(user);

    const inventoryPaste = screen.getByLabelText(/^inventory$/i);
    await commitField(inventoryPaste, 'Pistol x2\nUnknown Thing');

    expect(screen.getByRole('dialog', { name: /inventory text needs attention/i })).toBeInTheDocument();
    expect(screen.getByText('Unknown Thing')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /select build: grenade launcher/i })[0]).toBeInTheDocument();
  });

  it('lets result rows be selected with the keyboard', async () => {
    const user = userEvent.setup();
    render(<App />);
    await chooseCapeType(user);

    const firstSelectButton = screen.getAllByRole('button', { name: /select build/i })[0];
    firstSelectButton.focus();
    await user.keyboard('{Enter}');

    expect(firstSelectButton).toHaveClass('selected');
  });

  it('uses an accordion layout in medium windows and moves right after a cape parse', async () => {
    const user = userEvent.setup();
    setViewportWidth(1000);
    render(<App />);

    const inputPanel = document.querySelector('.step-panel[data-pane="input"]');
    const goalsPanel = document.querySelector('.step-panel[data-pane="goals"]');
    const outputPanel = document.querySelector('.step-panel[data-pane="output"]');

    expect(inputPanel).toHaveAttribute('data-collapsed', 'false');
    expect(goalsPanel).toHaveAttribute('data-collapsed', 'false');
    expect(outputPanel).toHaveAttribute('data-collapsed', 'true');

    expect(screen.getByRole('button', { name: /expand optimised builds/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /select build: grenade launcher/i })).not.toBeInTheDocument();

    await act(async () => {
      fireEvent.change(screen.getByLabelText(/^cape$/i), {
        target: { value: loadPasteFixture('pure-with-emoji-and-prepper') },
      });
      fireEvent.blur(screen.getByLabelText(/^cape$/i));
    });

    expect(inputPanel).toHaveAttribute('data-collapsed', 'true');
    expect(goalsPanel).toHaveAttribute('data-collapsed', 'false');
    expect(outputPanel).toHaveAttribute('data-collapsed', 'false');

    expect(screen.getByRole('button', { name: /expand your cape/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /expand optimised builds/i })).not.toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /select build: grenade launcher/i }).length).toBeGreaterThan(0);

    await user.click(screen.getByRole('button', { name: /expand your cape/i }));

    expect(inputPanel).toHaveAttribute('data-collapsed', 'false');
    expect(goalsPanel).toHaveAttribute('data-collapsed', 'false');
    expect(outputPanel).toHaveAttribute('data-collapsed', 'true');

    expect(screen.getByRole('button', { name: /expand optimised builds/i })).toBeInTheDocument();
    expect(screen.queryAllByRole('button', { name: /select build: grenade launcher/i })).toHaveLength(0);
  });

  it('shows all panes expanded in stacked mobile mode', () => {
    setViewportWidth(700);
    render(<App />);

    expect(document.querySelector('.step-panel[data-pane="input"]')).toHaveAttribute('data-collapsed', 'false');
    expect(document.querySelector('.step-panel[data-pane="goals"]')).toHaveAttribute('data-collapsed', 'false');
    expect(document.querySelector('.step-panel[data-pane="output"]')).toHaveAttribute('data-collapsed', 'false');
    
    // We check that the rails are disabled/aria-hidden since they are still mounted but inactive on mobile
    const inputRail = document.querySelector('.step-panel[data-pane="input"] .step-panel-collapsed-trigger');
    const outputRail = document.querySelector('.step-panel[data-pane="output"] .step-panel-collapsed-trigger');
    expect(inputRail).toBeDisabled();
    expect(inputRail).toHaveAttribute('aria-hidden', 'true');
    expect(outputRail).toBeDisabled();
    expect(outputRail).toHaveAttribute('aria-hidden', 'true');
  });

  it('does not move right or show modal when pasting empty cape text', async () => {
    setViewportWidth(1000);
    render(<App />);

    expect(screen.getByRole('button', { name: /expand optimised builds/i })).toBeInTheDocument();

    await act(async () => {
      fireEvent.change(screen.getByLabelText(/^cape$/i), {
        target: { value: '   ' },
      });
      fireEvent.blur(screen.getByLabelText(/^cape$/i));
    });

    expect(screen.getByRole('button', { name: /expand optimised builds/i })).toBeInTheDocument();
    expect(screen.queryByRole('dialog', { name: /cape text needs attention/i })).not.toBeInTheDocument();
  });

  it('opens a modal and does not move right when pasting invalid cape text', async () => {
    setViewportWidth(1000);
    render(<App />);

    expect(screen.getByRole('button', { name: /expand optimised builds/i })).toBeInTheDocument();

    const capeInput = screen.getByLabelText(/^cape$/i);
    await commitField(capeInput, 'hello world');

    expect(screen.getByRole('button', { name: /expand optimised builds/i })).toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: /cape text needs attention/i })).toBeInTheDocument();
    expect(screen.getAllByText('Could not find cape class.').length).toBeGreaterThan(0);
  });

  it('pastes a valid cape globally when no field is focused', async () => {
    render(<App />);

    await act(async () => {
      fireEvent.paste(document, {
        clipboardData: {
          getData: () => loadPasteFixture('pure-with-emoji-and-prepper'),
        },
      });
    });

    expect(screen.getByLabelText(/^class$/i)).toHaveValue('Tinker');
    expect(screen.getByLabelText(/^subclass$/i)).toHaveValue('Ambush');
    expect(screen.getByLabelText(/^cape$/i)).toHaveValue(loadPasteFixture('pure-with-emoji-and-prepper'));
    expect(screen.getByLabelText(/prepper/i)).toBeChecked();
    expect(screen.queryByRole('dialog', { name: /cape text needs attention/i })).not.toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /select build: grenade launcher/i }).length).toBeGreaterThan(0);
  });

  it('falls back to a valid inventory paste globally when cape parsing fails', async () => {
    render(<App />);

    await act(async () => {
      fireEvent.paste(document, {
        clipboardData: {
          getData: () => loadPasteFixture('inventory'),
        },
      });
    });

    expect(screen.getByLabelText(/^inventory$/i)).toHaveValue(loadPasteFixture('inventory'));
    expect(screen.queryByRole('dialog', { name: /inventory text needs attention/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /select build: taser$/i })).toBeInTheDocument();
  });

  it('clears selected stats when constraints remove the selected build', async () => {
    const user = userEvent.setup();
    render(<App />);
    await chooseCapeType(user);

    const firstSelectButton = screen.getAllByRole('button', { name: /select build/i })[0];
    await user.click(firstSelectButton);
    expect(firstSelectButton).toHaveClass('selected');

    const strengthMax = screen.getAllByLabelText(/^max$/i)[0];
    await commitField(strengthMax, '1');

    expect(firstSelectButton).not.toBeInTheDocument();
  });

  it('clamps goal min and max inputs to the handbook bounds', async () => {
    const user = userEvent.setup();
    render(<App />);
    await chooseCapeType(user);

    const minInput = screen.getAllByLabelText(/^min$/i)[0];
    const maxInput = screen.getAllByLabelText(/^max$/i)[0];

    await commitField(minInput, '0');
    expect(minInput).toHaveValue('1');

    await commitField(maxInput, '21');
    expect(maxInput).toHaveValue('20');
  });

  it('keeps goal stepper buttons inside the handbook bounds', async () => {
    const user = userEvent.setup();
    render(<App />);
    await chooseCapeType(user);

    const minInput = screen.getAllByLabelText(/^min$/i)[0];
    const maxInput = screen.getAllByLabelText(/^max$/i)[0];

    await commitField(minInput, '1');
    await user.click(screen.getByRole('button', { name: /decrease strength minimum/i }));
    expect(minInput).toHaveValue('1');

    await commitField(maxInput, '20');
    await user.click(screen.getByRole('button', { name: /increase strength maximum/i }));
    expect(maxInput).toHaveValue('20');
  });
});

async function chooseCapeType(user: ReturnType<typeof userEvent.setup>) {
  await user.selectOptions(screen.getByLabelText(/^class$/i), 'Tinker');
  await user.selectOptions(screen.getByLabelText(/^subclass$/i), 'Combat');
}

function setViewportWidth(width: number) {
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    value: width,
  });
  window.dispatchEvent(new Event('resize'));
}

async function commitField(field: HTMLElement, value: string) {
  await act(async () => {
    fireEvent.change(field, { target: { value } });
    fireEvent.blur(field);
  });
}
