import type { StatBlock, StatDefinition } from './types';

export const STATS: StatDefinition[] = [
  {
    id: 'strength',
    label: 'Strength',
    shortLabel: 'STR',
    emoji: '👊',
    aliases: ['strength', 'str', 's'],
    defaultMin: 1,
    defaultMax: 20,
  },
  {
    id: 'vitality',
    label: 'Vitality',
    shortLabel: 'VIT',
    emoji: '❤️',
    aliases: ['vitality', 'vit', 'v'],
    defaultMin: 1,
    defaultMax: 20,
  },
  {
    id: 'utility',
    label: 'Utility',
    shortLabel: 'UTL',
    emoji: '⚡',
    aliases: ['utility', 'utl', 'u'],
    defaultMin: 1,
    defaultMax: 20,
  },
  {
    id: 'control',
    label: 'Control',
    shortLabel: 'CTR',
    emoji: '⌚',
    aliases: ['control', 'ctr', 'c'],
    defaultMin: 1,
    defaultMax: 20,
  },
  {
    id: 'technique',
    label: 'Technique',
    shortLabel: 'TEQ',
    emoji: '🎯',
    aliases: ['technique', 'teq', 't'],
    defaultMin: 1,
    defaultMax: 20,
  },
] as const satisfies StatDefinition[];

export const STAT_IDS = STATS.map((stat) => stat.id);

export const EMPTY_STATS: StatBlock = {
  strength: 4,
  vitality: 3,
  utility: 4,
  control: 3,
  technique: 4,
};
