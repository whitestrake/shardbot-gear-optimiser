import { Fragment } from 'react';
import type { OptimisationRow } from '../domain/optimiser';
import { STATS } from '../domain/stats';
import type { CatalogItem } from '../domain/types';

interface ResultsMatrixProps {
  rows: OptimisationRow[];
  selectedRowKey: string | null;
  onSelect: (rowKey: string) => void;
  displayLimit?: number;
}

export function getOptimisationRowKey(row: OptimisationRow): string {
  return row.items.map((item) => item.id).join('|') || 'empty';
}

function getBuildLabel(row: OptimisationRow): string {
  const itemNames = row.items.map((item) => item.name);
  return itemNames.length > 0 ? itemNames.join(', ') : 'No items';
}
function formatItemEffects(item: CatalogItem): string {
  const parts: string[] = [];

  if (item.effects.set) {
    for (const [statId, value] of Object.entries(item.effects.set)) {
      if (value !== undefined) {
        const stat = STATS.find((s) => s.id === statId);
        const shortLabel = stat ? stat.shortLabel : statId.toUpperCase().slice(0, 3);
        parts.push(`=${value} ${shortLabel}`);
      }
    }
  }

  if (item.effects.alter) {
    for (const [statId, value] of Object.entries(item.effects.alter)) {
      if (value !== undefined && value !== 0) {
        const stat = STATS.find((s) => s.id === statId);
        const shortLabel = stat ? stat.shortLabel : statId.toUpperCase().slice(0, 3);
        const sign = value > 0 ? '+' : '';
        parts.push(`${sign}${value} ${shortLabel}`);
      }
    }
  }

  return parts.length > 0 ? ` (${parts.join(', ')})` : '';
}

export function ResultsMatrix({ rows, selectedRowKey, onSelect, displayLimit = 100 }: ResultsMatrixProps) {
  if (rows.length === 0) {
    return <p className="empty-state">No builds match the current strict constraints.</p>;
  }

  const displayedRows = rows.slice(0, displayLimit);

  return (
    <>
      <p className="result-count">
        Showing top {displayedRows.length} of {rows.length} builds
      </p>
      <div className="build-cards-list">
        {displayedRows.map((row) => {
          const rowKey = getOptimisationRowKey(row);
          const selected = selectedRowKey === rowKey;
          const weapon = row.items.find((item) => item.slot === 'Weapon');
          const costume = row.items.find((item) => item.slot === 'Costume');
          const gadget = row.items.find((item) => item.slot === 'Gadget');

          return (
            <div
              key={rowKey}
              role="button"
              tabIndex={0}
              className={`build-card ${selected ? 'selected' : ''}`}
              aria-label={`Select build: ${getBuildLabel(row)}`}
              aria-pressed={selected}
              onClick={() => onSelect(rowKey)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelect(rowKey);
                }
              }}
            >
              <div className="build-card-inner">
                <div className="build-card-content">
                  <div className="build-card-stats">
                    {STATS.map((stat, idx) => (
                      <Fragment key={stat.id}>
                        {idx > 0 && (
                          <span className="build-card-stats-divider" aria-hidden="true" />
                        )}
                        <span className="build-card-stat-item">
                          {stat.emoji} {stat.shortLabel} <strong className="build-card-stat-value">{row.finalStats[stat.id]}</strong>
                        </span>
                      </Fragment>
                    ))}
                  </div>
                  <div className="build-card-items-grid">
                    <div
                      className="build-card-grid-cell"
                      title={weapon ? `${weapon.name}${formatItemEffects(weapon)}` : undefined}
                    >
                      {weapon ? (
                        <>
                          <span className="build-card-item-name">{weapon.name}</span>
                          <span className="build-card-item-effects">{formatItemEffects(weapon)}</span>
                        </>
                      ) : (
                        <span className="build-card-item-empty">No Weapon</span>
                      )}
                    </div>
                    <div
                      className="build-card-grid-cell"
                      title={costume ? `${costume.name}${formatItemEffects(costume)}` : undefined}
                    >
                      {costume ? (
                        <>
                          <span className="build-card-item-name">{costume.name}</span>
                          <span className="build-card-item-effects">{formatItemEffects(costume)}</span>
                        </>
                      ) : (
                        <span className="build-card-item-empty">No Costume</span>
                      )}
                    </div>
                    <div
                      className="build-card-grid-cell"
                      title={gadget ? `${gadget.name}${formatItemEffects(gadget)}` : undefined}
                    >
                      {gadget ? (
                        <>
                          <span className="build-card-item-name">{gadget.name}</span>
                          <span className="build-card-item-effects">{formatItemEffects(gadget)}</span>
                        </>
                      ) : (
                        <span className="build-card-item-empty">No Gadget</span>
                      )}
                    </div>
                    <div className="build-card-grid-cell capacity-cell" title={`Capacity used: ${row.capacityUsed}`}>
                      <span className="build-card-slot-label">Capacity:</span>{' '}
                      <strong className="build-card-capacity-value">{row.capacityUsed}</strong>
                    </div>
                  </div>
                </div>
              </div>
              {!row.valid && (
                <span className="build-card-status-tag">
                  {row.violations.join(', ')}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
