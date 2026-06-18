import { CLASS_OPTIONS, SUBCLASS_OPTIONS_BY_CLASS } from './classes';
import { EMPTY_STATS, STATS } from './stats';
import type { CapeClass, CapeState, StatId } from './types';

export interface ParseCapeResult {
  cape: CapeState;
  warnings: string[];
}

const STAT_BY_ALIAS = new Map<string, StatId>();
for (const stat of STATS) {
  for (const alias of [...stat.aliases, stat.label, stat.shortLabel, stat.emoji]) {
    STAT_BY_ALIAS.set(alias.toLowerCase(), stat.id);
  }
}

function parseCapeClass(text: string): CapeClass | '' {
  const lower = text.toLowerCase();
  return CLASS_OPTIONS.find((capeClass) => lower.includes(capeClass.toLowerCase())) ?? '';
}

function isClassHeading(line: string): boolean {
  return /\bClass\b/i.test(line) && !CLASS_OPTIONS.some((capeClass) => line.toLowerCase().includes(capeClass.toLowerCase())) && !/[:=-]/.test(line);
}

function findCapeClassLine(lines: string[]): string | null {
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (isClassHeading(line)) {
      return lines[index + 1] ?? null;
    }

    if (parseCapeClass(line)) {
      return line;
    }
  }

  return null;
}

function parseSubclass(text: string, capeClass: CapeClass | ''): string {
  if (!capeClass) {
    return '';
  }

  const lower = text.toLowerCase();
  return (
    SUBCLASS_OPTIONS_BY_CLASS[capeClass].find((subclass) => lower.includes(subclass.toLowerCase())) ?? ''
  );
}

function parseStatLine(line: string): [StatId, number][] {
  const matches: [StatId, number][] = [];
  for (const segment of line.split('|')) {
    const trimmed = segment.trim();
    const statMatch = trimmed.match(/^(?:[^\w]*\s*)?([A-Za-z]+)\s*(?:[:=-]\s*)?(\d+)/);
    if (!statMatch) {
      continue;
    }

    const statId = STAT_BY_ALIAS.get(statMatch[1].toLowerCase());
    if (!statId) {
      continue;
    }

    matches.push([statId, Number(statMatch[2])]);
  }

  return matches;
}

function findCapeStatLine(lines: string[]): string | null {
  let sawBaseStatsHeading = false;

  for (const line of lines) {
    if (/\bBase Stats\b/i.test(line)) {
      sawBaseStatsHeading = true;
      continue;
    }
    
    if (sawBaseStatsHeading && /\b(?:Effective Stats|Skills|Feats|Inventory|Class)\b/i.test(line)) {
      break;
    }

    if (sawBaseStatsHeading && parseStatLine(line).length > 0) {
      return line;
    }
  }

  if (!sawBaseStatsHeading) {
    for (const line of lines) {
      if (/\b(?:Effective Stats|Skills|Feats|Inventory)\b/i.test(line)) {
        break;
      }
      if (parseStatLine(line).length > 0) {
        return line;
      }
    }
  }

  return null;
}

export function parseCapeText(text: string): ParseCapeResult {
  const lines = text.split(/\r?\n/).map((line) => line.trim());
  const nonEmptyLines = lines.filter((line) => line.length > 0);
  const warnings: string[] = [];

  const classLine = findCapeClassLine(nonEmptyLines);
  const capeClass = classLine ? parseCapeClass(classLine) : '';
  if (!capeClass) {
    warnings.push('Could not find cape class.');
  }

  const subclass = classLine ? parseSubclass(classLine, capeClass) : '';
  if (!subclass) {
    warnings.push('Could not find subclass.');
  }

  const stats = { ...EMPTY_STATS };
  const foundStats = new Set<StatId>();
  const statLine = findCapeStatLine(nonEmptyLines);
  if (statLine) {
    for (const [statId, value] of parseStatLine(statLine)) {
      stats[statId] = value;
      foundStats.add(statId);
    }
  }

  for (const stat of STATS) {
    if (!foundStats.has(stat.id)) {
      warnings.push(`Could not find ${stat.id}.`);
    }
  }

  let hasPrepper = false;
  let inActiveFeats = false;
  let sawFeatsHeading = false;

  for (const line of nonEmptyLines) {
    if (/^[^\w]*Feats\b/i.test(line)) {
      inActiveFeats = true;
      sawFeatsHeading = true;
      if (/\bprepper\b/i.test(line)) {
        hasPrepper = true;
      }
      continue;
    }
    
    if (inActiveFeats && /\b(?:Unused|Notes|Backstory|Inventory|Research|Instructions|Image|Generated|Character details)\b/i.test(line)) {
      inActiveFeats = false;
    }
    
    if (inActiveFeats && /\bprepper\b/i.test(line)) {
      hasPrepper = true;
    }
  }
  
  if (!sawFeatsHeading) {
    const textBeforeBounds = text.split(/\b(?:Unused|Notes|Backstory|Inventory|Research|Instructions|Image|Generated|Character details)\b/i)[0];
    hasPrepper = /\bprepper\b/i.test(textBeforeBounds);
  }

  return {
    cape: {
      capeClass,
      subclass,
      stats,
      hasPrepper,
    },
    warnings,
  };
}
