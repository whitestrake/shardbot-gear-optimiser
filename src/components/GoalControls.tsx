import { useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, GripVertical } from 'lucide-react';

import type { OptimisationGoals, OptimisationResult, StatConstraint } from '../domain/optimiser';
import { STATS } from '../domain/stats';
import type { StatBlock, StatId } from '../domain/types';
import { FeasibilityBar } from './FeasibilityBar';

const GOAL_MIN = 1;
const GOAL_MAX = 20;

type GoalDrafts = Record<StatId, { min: string; max: string }>;

interface GoalControlsProps {
  goals: OptimisationGoals;
  baseStats: StatBlock;
  selectedStats: StatBlock | null;
  result: OptimisationResult;
  onChange: (goals: OptimisationGoals) => void;
}

export function GoalControls({ goals, baseStats, selectedStats, result, onChange }: GoalControlsProps) {
  const [constraintDrafts, setConstraintDrafts] = useState<GoalDrafts>(() =>
    Object.fromEntries(
      STATS.map((stat) => {
        const constraint = goals.constraints[stat.id] ?? {
          enabled: true,
          min: stat.defaultMin,
          max: stat.defaultMax,
        };
        return [stat.id, { min: String(constraint.min), max: String(constraint.max) }];
      }),
    ) as GoalDrafts,
  );

  useEffect(() => {
    setConstraintDrafts(
      Object.fromEntries(
        STATS.map((stat) => {
          const constraint = goals.constraints[stat.id] ?? {
            enabled: true,
            min: stat.defaultMin,
            max: stat.defaultMax,
          };
          return [stat.id, { min: String(constraint.min), max: String(constraint.max) }];
        }),
      ) as GoalDrafts,
    );
  }, [goals.constraints]);

  function setPriority(nextPriority: StatId[]) {
    onChange({ ...goals, priority: nextPriority });
  }

  function move(stat: StatId, direction: -1 | 1) {
    const index = goals.priority.indexOf(stat);
    const nextIndex = index + direction;

    if (nextIndex < 0 || nextIndex >= goals.priority.length) {
      return;
    }

    const nextPriority = [...goals.priority];
    nextPriority[index] = goals.priority[nextIndex];
    nextPriority[nextIndex] = stat;
    setPriority(nextPriority);
  }

  const [draggedStat, setDraggedStat] = useState<StatId | null>(null);

  function handleDragStart(event: React.DragEvent, statId: StatId) {
    event.dataTransfer.setData('text/plain', statId);
    const card = (event.currentTarget as HTMLElement).closest('.goal-row');
    if (card) {
      const rect = card.getBoundingClientRect();
      const xOffset = event.clientX - rect.left;
      const yOffset = event.clientY - rect.top;
      event.dataTransfer.setDragImage(card, xOffset, yOffset);
    }
    // Timeout to let the browser capture the opaque drag image first
    setTimeout(() => {
      setDraggedStat(statId);
    }, 0);
  }

  function handleDragOver(event: React.DragEvent, targetStatId: StatId) {
    event.preventDefault();
    if (!draggedStat || draggedStat === targetStatId) {
      return;
    }

    const draggedIndex = goals.priority.indexOf(draggedStat);
    const targetIndex = goals.priority.indexOf(targetStatId);

    if (draggedIndex !== targetIndex) {
      const nextPriority = goals.priority.filter((id) => id !== draggedStat);
      nextPriority.splice(targetIndex, 0, draggedStat);
      setPriority(nextPriority);
    }
  }

  function handleDragEnd() {
    setDraggedStat(null);
  }

  function updateConstraint(statId: StatId, nextConstraint: StatConstraint) {
    setConstraintDrafts((current) => ({
      ...current,
      [statId]: { min: String(nextConstraint.min), max: String(nextConstraint.max) },
    }));
    onChange({
      ...goals,
      constraints: {
        ...goals.constraints,
        [statId]: nextConstraint,
      },
    });
  }

  return (
    <div className="goal-list">
      {goals.priority.map((statId) => {
        const stat = STATS.find((item) => item.id === statId);
        if (!stat) {
          return null;
        }

        const constraint = goals.constraints[statId] ?? {
          enabled: true,
          min: stat.defaultMin,
          max: stat.defaultMax,
        };
        const range = result.feasibleRanges[statId] ?? { min: baseStats[statId], max: baseStats[statId] };
        const drafts = constraintDrafts[statId] ?? {
          min: String(constraint.min),
          max: String(constraint.max),
        };

        function clampGoalValue(value: number) {
          return Math.min(GOAL_MAX, Math.max(GOAL_MIN, value));
        }

        function commitConstraint(key: 'min' | 'max', rawValue: string) {
          const parsed = Number(rawValue);
          updateConstraint(statId, { ...constraint, [key]: clampGoalValue(Number.isFinite(parsed) ? parsed : GOAL_MIN) });
        }

        function adjustConstraint(key: 'min' | 'max', delta: number) {
          const nextValue = clampGoalValue(constraint[key] + delta);
          if (nextValue === constraint[key]) {
            return;
          }
          updateConstraint(statId, { ...constraint, [key]: nextValue });
        }

        return (
          <div
            className={`goal-row ${draggedStat === statId ? 'dragging' : ''} ${!constraint.enabled ? 'disabled' : ''}`}
            key={statId}
            onDragOver={(event) => handleDragOver(event, statId)}
            onDrop={(event) => event.preventDefault()}
          >
            <div className="goal-row-header">
              <div className="goal-row-header-left">
                <button
                  type="button"
                  className="drag-handle-compact"
                  aria-label={`Drag ${stat.label} priority`}
                  draggable
                  onDragStart={(event) => handleDragStart(event, statId)}
                  onDragEnd={handleDragEnd}
                >
                  <GripVertical size={14} />
                </button>
                <label className="checkbox-row">
                  <input
                    type="checkbox"
                    checked={constraint.enabled}
                    onChange={(event) => updateConstraint(statId, { ...constraint, enabled: event.target.checked })}
                  />
                  <span className="stat-inline-copy">
                    <span className="stat-inline-name">
                      {stat.emoji} {stat.shortLabel}
                    </span>
                    <span className="stat-inline-note">
                      {stat.id === 'strength'
                        ? 'the damage you deal'
                        : stat.id === 'vitality'
                          ? 'how much you can take'
                          : stat.id === 'utility'
                            ? 'subclass effectiveness'
                            : stat.id === 'control'
                              ? 'turn order and targeting'
                              : 'chance to hit or defend'}
                    </span>
                  </span>
                </label>
              </div>
              <div className="priority-buttons">
                <button
                  type="button"
                  aria-label={`Move ${stat.label} up`}
                  onClick={() => move(statId, -1)}
                >
                  <ArrowUp size={14} />
                </button>
                <button
                  type="button"
                  aria-label={`Move ${stat.label} down`}
                  onClick={() => move(statId, 1)}
                >
                  <ArrowDown size={14} />
                </button>
              </div>
            </div>
            {constraint.enabled && (
              <div className="goal-visualizer-container">
                <div className="constraint-stepper">
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    aria-label="Min"
                    className="constraint-number-input"
                    value={drafts.min}
                    onChange={(event) =>
                      setConstraintDrafts((current) => ({
                        ...current,
                        [statId]: {
                          ...current[statId],
                          min: event.target.value.replace(/[^\d]/g, ''),
                        },
                      }))
                    }
                    onBlur={(event) => commitConstraint('min', event.target.value)}
                    onFocus={(event) => event.currentTarget.select()}
                  />
                  <div className="stat-stepper-buttons constraint-stepper-buttons">
                    <button type="button" tabIndex={-1} aria-label={`Increase ${stat.label} minimum`} onClick={() => adjustConstraint('min', 1)}>
                      <ArrowUp size={10} />
                    </button>
                    <button type="button" tabIndex={-1} aria-label={`Decrease ${stat.label} minimum`} onClick={() => adjustConstraint('min', -1)}>
                      <ArrowDown size={10} />
                    </button>
                  </div>
                </div>
                <FeasibilityBar
                  defaultMin={stat.defaultMin}
                  defaultMax={stat.defaultMax}
                  feasibleMin={range.min}
                  feasibleMax={range.max}
                  constraintMin={constraint.min}
                  constraintMax={constraint.max}
                  baseValue={baseStats[statId]}
                  selectedValue={selectedStats?.[statId] ?? null}
                  onConstraintChange={(nextMin, nextMax) => updateConstraint(statId, { ...constraint, min: nextMin, max: nextMax })}
                />
                <div className="constraint-stepper">
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    aria-label="Max"
                    className="constraint-number-input"
                    value={drafts.max}
                    onChange={(event) =>
                      setConstraintDrafts((current) => ({
                        ...current,
                        [statId]: {
                          ...current[statId],
                          max: event.target.value.replace(/[^\d]/g, ''),
                        },
                      }))
                    }
                    onBlur={(event) => commitConstraint('max', event.target.value)}
                    onFocus={(event) => event.currentTarget.select()}
                  />
                  <div className="stat-stepper-buttons constraint-stepper-buttons">
                    <button type="button" tabIndex={-1} aria-label={`Increase ${stat.label} maximum`} onClick={() => adjustConstraint('max', 1)}>
                      <ArrowUp size={10} />
                    </button>
                    <button type="button" tabIndex={-1} aria-label={`Decrease ${stat.label} maximum`} onClick={() => adjustConstraint('max', -1)}>
                      <ArrowDown size={10} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
