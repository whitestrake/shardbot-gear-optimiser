import { STAT_IDS, STATS } from './stats';
import { applyItemsToStats } from './statMath';
import { getItemCombinations } from './itemRules';
import type { CapeState, CatalogItem, GameRules, StatBlock, StatId } from './types';

export interface StatConstraint {
  enabled: boolean;
  min: number;
  max: number;
}

export interface OptimisationGoals {
  priority: StatId[];
  constraints: Partial<Record<StatId, StatConstraint>>;
}

export interface OptimiseInput {
  cape: CapeState;
  items: CatalogItem[];
  rules: GameRules;
  goals: OptimisationGoals;
  includeClosestMisses: boolean;
}

export interface OptimisationRow {
  items: CatalogItem[];
  capacityUsed: number;
  finalStats: StatBlock;
  total: number;
  waste: number;
  valid: boolean;
  violations: string[];
  missDistance: number;
}

export interface OptimisationResult {
  rows: OptimisationRow[];
  feasibleRanges: Record<StatId, { min: number; max: number }>;
}

type RankedStat = StatId;

function sumStats(stats: StatBlock): number {
  return STAT_IDS.reduce((total, statId) => total + stats[statId], 0);
}

function getConstraintEntries(goals: OptimisationGoals): Array<[StatId, StatConstraint]> {
  return STAT_IDS.flatMap((statId) => {
    const constraint = goals.constraints[statId];
    return constraint?.enabled ? ([[statId, constraint] as [StatId, StatConstraint]]) : [];
  });
}

function getRankingStats(goals: OptimisationGoals): RankedStat[] {
  return goals.priority.filter((statId) => goals.constraints[statId]?.enabled);
}

function buildViolationsAndDistance(
  finalStats: StatBlock,
  goals: OptimisationGoals,
): { violations: string[]; waste: number; missDistance: number; valid: boolean } {
  const violations: string[] = [];
  let waste = 0;
  let missDistance = 0;

  for (const [statId, constraint] of getConstraintEntries(goals)) {
    const value = finalStats[statId];
    const label = STATS.find((stat) => stat.id === statId)?.label ?? statId;

    if (value < constraint.min) {
      const delta = constraint.min - value;
      violations.push(`${label} is ${delta} below minimum`);
      missDistance += delta;
    }

    if (value > constraint.max) {
      const delta = value - constraint.max;
      violations.push(`${label} is ${delta} above maximum`);
      waste += delta;
      missDistance += delta;
    }
  }

  return {
    violations,
    waste,
    missDistance,
    valid: violations.length === 0,
  };
}

function compareRows(left: OptimisationRow, right: OptimisationRow, rankingStats: RankedStat[]): number {
  if (left.valid !== right.valid) {
    return left.valid ? -1 : 1;
  }

  if (left.missDistance !== right.missDistance) {
    return left.missDistance - right.missDistance;
  }

  for (const statId of rankingStats) {
    const delta = right.finalStats[statId] - left.finalStats[statId];
    if (delta !== 0) {
      return delta;
    }
  }

  if (left.total !== right.total) {
    return right.total - left.total;
  }

  if (left.waste !== right.waste) {
    return left.waste - right.waste;
  }

  return 0;
}

function buildFeasibleRanges(rows: OptimisationRow[]): Record<StatId, { min: number; max: number }> {
  const ranges = {} as Record<StatId, { min: number; max: number }>;

  for (const statId of STAT_IDS) {
    let min = Number.POSITIVE_INFINITY;
    let max = Number.NEGATIVE_INFINITY;

    for (const row of rows) {
      const value = row.finalStats[statId];
      if (value < min) {
        min = value;
      }
      if (value > max) {
        max = value;
      }
    }

    ranges[statId] = { min, max };
  }

  return ranges;
}

export function optimiseBuilds(input: OptimiseInput): OptimisationResult {
  const combinations = getItemCombinations(input.cape, input.items, input.rules);
  const rankingStats = getRankingStats(input.goals);

  const rows = combinations.map<OptimisationRow>((combination) => {
    const finalStats = applyItemsToStats(input.cape.stats, combination.items, input.rules);
    const { violations, waste, missDistance, valid } = buildViolationsAndDistance(finalStats, input.goals);

    return {
      items: combination.items,
      capacityUsed: combination.capacityUsed,
      finalStats,
      total: sumStats(finalStats),
      waste,
      valid,
      violations,
      missDistance,
    };
  });

  const sortedRows = [...rows].sort((left, right) => compareRows(left, right, rankingStats));
  const filteredRows = input.includeClosestMisses ? sortedRows : sortedRows.filter((row) => row.valid);
  const feasibleSourceRows = rows.some((row) => row.valid) ? rows.filter((row) => row.valid) : rows;

  return {
    rows: filteredRows,
    feasibleRanges: buildFeasibleRanges(feasibleSourceRows),
  };
}
