export type StatId = 'strength' | 'vitality' | 'utility' | 'control' | 'technique';

export type ItemSlot = 'Weapon' | 'Costume' | 'Gadget';

export type CapeClass =
  | 'Blaster'
  | 'Breaker'
  | 'Brute'
  | 'Changer'
  | 'Master'
  | 'Mover'
  | 'Shaker'
  | 'Stranger'
  | 'Striker'
  | 'Thinker'
  | 'Tinker'
  | 'Trump';

export type SubclassKey = `${CapeClass}:${string}`;

export type StatBlock = Record<StatId, number>;

export interface StatDefinition {
  id: StatId;
  label: string;
  shortLabel: string;
  emoji: string;
  aliases: string[];
  defaultMin: number;
  defaultMax: number;
}

export interface CapeState {
  capeClass: CapeClass | '';
  subclass: string;
  stats: StatBlock;
  hasPrepper: boolean;
}

export interface ItemEffects {
  set: Partial<StatBlock>;
  alter: Partial<StatBlock>;
}

export interface ItemRestrictions {
  classes?: CapeClass[];
  subclasses?: SubclassKey[];
}

export interface CatalogItem {
  id: string;
  name: string;
  slot: ItemSlot;
  capacity: number;
  effects: ItemEffects;
  restrictions?: ItemRestrictions;
  description?: string;
}

export interface GameRules {
  baseCapacity: number;
  prepperCapacityBonus: number;
  slotOrder: ItemSlot[];
  statFloor: number;
}
