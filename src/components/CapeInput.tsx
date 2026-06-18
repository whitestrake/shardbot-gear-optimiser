import { useEffect, useState } from 'react';
import { ArrowDown, ArrowUp } from 'lucide-react';

import { CLASS_OPTIONS, SUBCLASS_OPTIONS_BY_CLASS } from '../domain/classes';
import { STATS } from '../domain/stats';
import type { CapeClass, CapeState, StatId } from '../domain/types';

interface CapeInputProps {
  cape: CapeState;
  onChange: (cape: CapeState) => void;
  capeText: string;
  onCapeTextChange: (value: string) => void;
  capeParseIssues: string[] | null;
  onCapeCommit: () => void;
  inventoryText: string;
  onInventoryTextChange: (value: string) => void;
  onInventoryCommit: () => void;
}

const DEFAULT_CAPE_CLASS: CapeClass = 'Breaker';

export function CapeInput({
  cape,
  onChange,
  capeText,
  onCapeTextChange,
  capeParseIssues,
  onCapeCommit,
  inventoryText,
  onInventoryTextChange,
  onInventoryCommit,
}: CapeInputProps) {
  const [statDrafts, setStatDrafts] = useState<Record<StatId, string>>(() =>
    Object.fromEntries(STATS.map((stat) => [stat.id, String(cape.stats[stat.id])])) as Record<StatId, string>,
  );

  useEffect(() => {
    setStatDrafts(Object.fromEntries(STATS.map((stat) => [stat.id, String(cape.stats[stat.id])])) as Record<
      StatId,
      string
    >);
  }, [cape.stats]);

  const subclassOptions = cape.capeClass ? SUBCLASS_OPTIONS_BY_CLASS[cape.capeClass] : [];

  function updateStat(stat: StatId, value: string) {
    onChange({
      ...cape,
      stats: {
        ...cape.stats,
        [stat]: Number(value),
      },
    });
  }

  function commitStat(stat: StatId) {
    const draftValue = statDrafts[stat];
    if (draftValue === '') {
      setStatDrafts((current) => ({
        ...current,
        [stat]: String(cape.stats[stat]),
      }));
      return;
    }

    const statDef = STATS.find((s) => s.id === stat)!;
    let numValue = Number(draftValue);
    if (Number.isNaN(numValue)) {
      numValue = cape.stats[stat];
    }
    
    numValue = Math.max(statDef.defaultMin, Math.min(statDef.defaultMax, numValue));
    
    if (numValue !== Number(draftValue)) {
      setStatDrafts((current) => ({
        ...current,
        [stat]: String(numValue),
      }));
    }

    updateStat(stat, String(numValue));
  }

  function adjustStat(stat: StatId, delta: number) {
    const currentValue = Number(statDrafts[stat] || cape.stats[stat]);
    const nextValue = Math.max(1, currentValue + delta);
    setStatDrafts((current) => ({
      ...current,
      [stat]: String(nextValue),
    }));
    updateStat(stat, String(nextValue));
  }

  function updateCapeClass(nextClass: CapeClass) {
    onChange({
      ...cape,
      capeClass: nextClass,
      subclass: SUBCLASS_OPTIONS_BY_CLASS[nextClass][0] ?? '',
    });
  }

  return (
    <div className="stack">
      <div className="input-top-row">
        <label className="compact-field">
          <span className="field-label">Class</span>
          <select
            value={cape.capeClass || DEFAULT_CAPE_CLASS}
            onChange={(event) => updateCapeClass(event.target.value as CapeClass)}
          >
            {CLASS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label className="compact-field">
          <span className="field-label">Subclass</span>
          <select
            value={cape.subclass || subclassOptions[0] || ''}
            onChange={(event) => onChange({ ...cape, subclass: event.target.value })}
          >
            {subclassOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="stat-strip">
        {STATS.map((stat) => (
          <div key={stat.id} className="stat-cell">
            <div className="field-label">
              {stat.emoji} {stat.shortLabel}
            </div>
            <div className="stat-stepper">
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                aria-label={stat.label}
                value={statDrafts[stat.id]}
                onFocus={(event) => event.currentTarget.select()}
                onChange={(event) =>
                  setStatDrafts((current) => ({
                    ...current,
                    [stat.id]: event.target.value.replace(/[^\d]/g, ''),
                  }))
                }
                onBlur={() => commitStat(stat.id)}
              />
              <div className="stat-stepper-buttons">
                <button type="button" tabIndex={-1} aria-label={`Increase ${stat.label}`} onClick={() => adjustStat(stat.id, 1)}>
                  <ArrowUp size={10} />
                </button>
                <button type="button" tabIndex={-1} aria-label={`Decrease ${stat.label}`} onClick={() => adjustStat(stat.id, -1)}>
                  <ArrowDown size={10} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <label className="checkbox-row prepper-toggle">
        <input
          type="checkbox"
          checked={cape.hasPrepper}
          onChange={(event) => onChange({ ...cape, hasPrepper: event.target.checked })}
        />
        Prepper <span className="prepper-inline-note">adds +1 capacity</span>
      </label>

      <div className="input-methods-divider" aria-hidden="true">
        <ArrowUp size={14} />
        <div className="input-methods-copy">
          <div className="input-methods-title">Two ways to input</div>
          <div className="input-methods-subtitle">Paste /cape below or set stats above</div>
        </div>
        <ArrowDown size={14} />
      </div>

      <label className="field-block">
        <span className="field-label">Cape</span>
        <textarea
          value={capeText}
          onChange={(event) => onCapeTextChange(event.target.value)}
          onFocus={(event) => event.currentTarget.select()}
          onClick={(event) => event.currentTarget.select()}
          onBlur={onCapeCommit}
          rows={8}
        />
      </label>
      {capeParseIssues && capeParseIssues.length > 0 && (
        <ul className="warnings">
          {capeParseIssues.map((warning) => (
            <li key={warning}>{warning}</li>
          ))}
        </ul>
      )}

      <label className="field-block">
        <span className="field-label">Inventory</span>
        <textarea
          value={inventoryText}
          onChange={(event) => onInventoryTextChange(event.target.value)}
          onFocus={(event) => event.currentTarget.select()}
          onClick={(event) => event.currentTarget.select()}
          rows={5}
          placeholder="Paste /inventory to limit results to what you have available"
          onBlur={onInventoryCommit}
        />
      </label>
    </div>
  );
}
