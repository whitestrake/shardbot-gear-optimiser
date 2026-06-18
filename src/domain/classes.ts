import type { CapeClass, SubclassKey } from './types';

export const CLASS_OPTIONS: CapeClass[] = [
  'Blaster',
  'Breaker',
  'Brute',
  'Changer',
  'Master',
  'Mover',
  'Shaker',
  'Stranger',
  'Striker',
  'Thinker',
  'Tinker',
  'Trump',
];

export const WEAPON_ACCESS_CLASSES: CapeClass[] = [
  'Brute',
  'Changer',
  'Master',
  'Mover',
  'Stranger',
  'Striker',
  'Thinker',
  'Tinker',
];

export const SUBCLASS_OPTIONS_BY_CLASS: Record<CapeClass, string[]> = {
  Blaster: ['Nuker', 'Artillery', 'Suppression'],
  Breaker: ['Negation', 'Focus', 'Cycle'],
  Brute: ['Negation', 'Mitigation', 'Regeneration'],
  Changer: ['Adaption', 'Feast', 'Growth'],
  Master: ['Trample', 'Swarm', 'Anchor'],
  Mover: ['Infiltrator', 'Slippery', 'Blitz'],
  Shaker: ['Nuker', 'Environment', 'Siege'],
  Stranger: ['Ambush', 'Avoidance', 'Strife'],
  Striker: ['Debuff', 'Flurry', 'All or Nothing'],
  Thinker: ['Strategist', 'Surveillance', 'Combat'],
  Tinker: ['Mitigation', 'Nuker', 'Artillery', 'Cycle', 'Surveillance', 'Combat', 'Debuff', 'Flurry', 'Ambush', 'Blitz'],
  Trump: ['Deny', 'Copy', 'Grant', 'Swap'],
};

export const ALL_SUBCLASS_OPTIONS: SubclassKey[] = CLASS_OPTIONS.flatMap((capeClass) =>
  SUBCLASS_OPTIONS_BY_CLASS[capeClass].map((subclass) => `${capeClass}:${subclass}` as SubclassKey),
);
