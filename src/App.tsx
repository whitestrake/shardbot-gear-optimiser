import { useEffect, useMemo, useState } from 'react';

import { CapeInput } from './components/CapeInput';
import { GoalControls } from './components/GoalControls';
import { Modal } from './components/Modal';
import { getOptimisationRowKey, ResultsMatrix } from './components/ResultsMatrix';
import { StepPanel } from './components/StepPanel';
import { ITEM_CATALOG } from './domain/catalog';
import { parseCapeText } from './domain/capeParser';
import { filterItemsByInventory, parseInventoryTextWithValidation, type InventoryQuantities } from './domain/inventory';
import { optimiseBuilds, type OptimisationGoals, type OptimisationResult } from './domain/optimiser';
import { GAME_RULES } from './domain/rules';
import { EMPTY_STATS, STATS, STAT_IDS } from './domain/stats';
import type { CapeState } from './domain/types';

const MOBILE_LAYOUT_MAX_WIDTH = 959;
const FULL_LAYOUT_MIN_WIDTH = 1301;

type ViewportMode = 'full' | 'accordion' | 'stack';
type AccordionPane = 'input' | 'output';

const initialCape: CapeState = {
  capeClass: 'Brute',
  subclass: 'Negation',
  hasPrepper: false,
  stats: { ...EMPTY_STATS },
};

const initialGoals: OptimisationGoals = {
  priority: [...STAT_IDS],
  constraints: Object.fromEntries(
    STATS.map((stat) => [stat.id, { enabled: true, min: stat.defaultMin, max: stat.defaultMax }]),
  ) as OptimisationGoals['constraints'],
};

const emptyResult: OptimisationResult = {
  rows: [],
  feasibleRanges: {} as OptimisationResult['feasibleRanges'],
};

function getViewportMode(width: number): ViewportMode {
  if (width <= MOBILE_LAYOUT_MAX_WIDTH) {
    return 'stack';
  }

  if (width >= FULL_LAYOUT_MIN_WIDTH) {
    return 'full';
  }

  return 'accordion';
}

export function App() {
  const [cape, setCape] = useState<CapeState>(initialCape);
  const [capeText, setCapeText] = useState('');
  const [goals, setGoals] = useState<OptimisationGoals>(initialGoals);
  const [includeClosestMisses, setIncludeClosestMisses] = useState(false);
  const [selectedRowKey, setSelectedRowKey] = useState<string | null>(null);
  const [inventoryText, setInventoryText] = useState('');
  const [inventoryQuantities, setInventoryQuantities] = useState<InventoryQuantities | null>(null);
  const [inventoryParseIssues, setInventoryParseIssues] = useState<string[] | null>(null);
  const [capeParseIssues, setCapeParseIssues] = useState<string[] | null>(null);
  const [viewportMode, setViewportMode] = useState<ViewportMode>(() => getViewportMode(window.innerWidth));
  const [accordionPane, setAccordionPane] = useState<AccordionPane>('input');
  const canOptimise = Boolean(cape.capeClass && cape.subclass);
  const accordionMode = viewportMode === 'accordion';

  useEffect(() => {
    function updateViewportMode() {
      setViewportMode(getViewportMode(window.innerWidth));
    }

    window.addEventListener('resize', updateViewportMode);
    updateViewportMode();

    return () => {
      window.removeEventListener('resize', updateViewportMode);
    };
  }, []);

  useEffect(() => {
    function handleGlobalPaste(event: ClipboardEvent) {
      const activeElement = document.activeElement;
      if (
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        activeElement instanceof HTMLSelectElement ||
        activeElement?.getAttribute('contenteditable') === 'true'
      ) {
        return;
      }

      const text = event.clipboardData?.getData('text/plain') ?? '';
      if (!text.trim()) {
        return;
      }

      const capeResult = parseCapeText(text);
      if (capeResult.warnings.length === 0) {
        event.preventDefault();
        setCapeText(text);
        setCape(capeResult.cape);
        setCapeParseIssues(null);
        setAccordionPane('output');
        return;
      }

      const inventoryResult = parseInventoryTextWithValidation(text, ITEM_CATALOG);
      const hasUsableEntries = Object.keys(inventoryResult.quantities).length > 0;
      if (inventoryResult.invalidLines.length === 0 && hasUsableEntries) {
        event.preventDefault();
        setInventoryText(text);
        setInventoryQuantities(inventoryResult.quantities);
        setInventoryParseIssues(null);
      }
    }

    document.addEventListener('paste', handleGlobalPaste);
    return () => {
      document.removeEventListener('paste', handleGlobalPaste);
    };
  }, []);

  const activeItems = useMemo(() => {
    if (!inventoryQuantities) {
      return ITEM_CATALOG;
    }

    return filterItemsByInventory(ITEM_CATALOG, inventoryQuantities);
  }, [inventoryQuantities]);

  function commitInventoryText(nextText = inventoryText, showIssues = true) {
    const result = parseInventoryTextWithValidation(nextText, ITEM_CATALOG);
    const hasUsableEntries = Object.keys(result.quantities).length > 0;

    if (result.invalidLines.length > 0 || !hasUsableEntries) {
      if (showIssues) {
        setInventoryQuantities(null);
        setInventoryParseIssues(result.invalidLines.length > 0 ? result.invalidLines : null);
      }
      return;
    }

    setInventoryText(nextText);
    setInventoryQuantities(result.quantities);
    setInventoryParseIssues(null);
  }

  function commitCapeText(nextText = capeText, showIssues = true) {
    if (!nextText.trim()) {
      if (showIssues) {
        setCapeParseIssues(null);
      }
      return;
    }

    const result = parseCapeText(nextText);
    if (result.warnings.length === 0) {
      setCapeText(nextText);
      setCape(result.cape);
      setCapeParseIssues(null);
      setAccordionPane('output');
      return;
    }

    if (showIssues) {
      setCapeParseIssues(result.warnings);
    }
  }

  const result = useMemo(() => {
    if (!canOptimise) {
      return emptyResult;
    }

    return (
      optimiseBuilds({
        cape,
        items: activeItems,
        rules: GAME_RULES,
        goals,
        includeClosestMisses,
      })
    );
  }, [activeItems, canOptimise, cape, goals, includeClosestMisses]);

  const selectedRow = useMemo(
    () => result.rows.find((row) => getOptimisationRowKey(row) === selectedRowKey) ?? null,
    [result.rows, selectedRowKey],
  );

  return (
    <main className={`app-shell mode-${viewportMode} pane-${accordionPane}`}>
      <section className="app-title">
        <h1>Shardbot Gear Optimiser</h1>
        <p>Plan feasible item builds from a cape, stat goals, and the full item list</p>
      </section>

      <div className={`step-layout layout-${viewportMode} pane-${accordionPane}`}>
        <StepPanel
          pane="input"
          step={1}
          title="Your Cape"
          description="Specify your class and stats. You can paste the output of /cape or /inventory anywhere on the page to automatically parse and prefill these fields."
          collapsed={accordionMode && accordionPane === 'output'}
          onCollapsedClick={() => setAccordionPane('input')}
        >
          <CapeInput
            cape={cape}
            onChange={setCape}
            capeText={capeText}
            onCapeTextChange={setCapeText}
            capeParseIssues={capeParseIssues}
            onCapeCommit={() => commitCapeText()}
            inventoryText={inventoryText}
            onInventoryTextChange={setInventoryText}
            onInventoryCommit={() => commitInventoryText()}
          />
        </StepPanel>

        <StepPanel
          pane="goals"
          step={2}
          title="Stat Prioritisation"
          description="Establish your target stat limits and drag to prioritise which stats are most important, or disable specific stats from being optimised for."
        >
          <GoalControls
            goals={goals}
            baseStats={cape.stats}
            selectedStats={selectedRow?.finalStats ?? null}
            result={result}
            onChange={setGoals}
          />
        </StepPanel>

        <StepPanel
          pane="output"
          step={3}
          title="Optimised Builds"
          description="Explore valid item builds that meet your constraints, ordered by your priorities. Select one to compare it on the visualiser to the left."
          collapsed={accordionMode && accordionPane === 'input'}
          onCollapsedClick={() => setAccordionPane('output')}
        >
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={includeClosestMisses}
              onChange={(event) => setIncludeClosestMisses(event.target.checked)}
            />
            Show closest misses
          </label>
          {canOptimise ? (
            <ResultsMatrix
              rows={result.rows}
              selectedRowKey={selectedRowKey}
              onSelect={setSelectedRowKey}
            />
          ) : (
            <p className="empty-state">Select a class and subclass to optimise item builds.</p>
          )}
        </StepPanel>
      </div>

      {inventoryParseIssues && (
        <Modal
          title="Inventory text needs attention"
          titleId="inventory-parse-title"
          onClose={() => setInventoryParseIssues(null)}
        >
          <p className="modal-copy">
            The inventory paste was not clean enough to activate limiting. Fix the lines below or clear the box.
          </p>
          <ul className="modal-list">
            {inventoryParseIssues.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </Modal>
      )}

      {capeParseIssues && (
        <Modal
          title="Cape text needs attention"
          titleId="cape-parse-title"
          onClose={() => setCapeParseIssues(null)}
        >
          <p className="modal-copy">
            The cape paste was not clean enough to parse. Make sure it contains a class, subclass, and stats.
          </p>
          <ul className="modal-list">
            {capeParseIssues.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </Modal>
      )}
    </main>
  );
}
