export enum MonsterType {
  FIRE = 'fire',
  WATER = 'water',
}

export enum MoveCategory {
  PHYSICAL = 'physical',
  SPECIAL = 'special',
  STATUS = 'status',
}

export interface MonsterStats {
  hp: number;
  attack: number;
  defense: number;
  specialAttack: number;
  specialDefense: number;
  speed: number;
}

export interface Ability {
  id: string;
  name: string;
  description: string;
  effect: string;
}

export interface Move {
  id: string;
  name: string;
  type: MonsterType;
  category: MoveCategory;
  power: number;
  accuracy: number;
  pp: number;
  description: string;
  effect?: string;
}

export interface Monster {
  id: string;
  name: string;
  type: MonsterType[];
  baseStats: MonsterStats;
  abilities: string[]; // ability ids
  learnableMoves: string[]; // move ids
  description: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
  growth_index: number;
}

export interface MonsterInstance {
  id: string;
  monsterId: string;
  name: string;
  level: number;
  currentHp: number;
  maxHp: number;
  stats: MonsterStats;
  moves: string[]; // move ids (max 4)
  movePP: Record<string, number>; // current PP for each move
  ability: string; // ability id
  experience: number;
  isShiny?: boolean;
}

export interface GameRun {
  id: string;
  playerId: string;
  currentStage: number;
  team: MonsterInstance[];
  inventory: Item[];
  currency: number;
  isActive: boolean;
  createdAt: Date;
  endedAt?: Date;
  temporaryEffects?: {
    shinyBoost?: {
      active: boolean;
      duration: number;
      multiplier: number;
    };
    statBoosts?: {
      attack?: number;
      defense?: number;
      speed?: number;
    };
  };
}

export interface Item {
  id: string;
  name: string;
  description: string;
  type: 'healing' | 'capture' | 'battle' | 'misc';
  effect: string;
  quantity: number;
  rarity?: 'common' | 'uncommon' | 'rare' | 'legendary';
  value?: number;
}

export interface Player {
  id: string;
  username: string;
  permanentCurrency: number;
  unlockedStarters: string[]; // monster ids
  unlockedAbilities: string[]; // passive ability ids
  totalRuns: number;
  bestStage: number;
  createdAt: Date;
}

export interface BattleAction {
  type: 'attack' | 'catch' | 'item' | 'switch' | 'flee';
  moveId?: string;
  targetId?: string;
  itemId?: string;
  newMonsterId?: string;
}

export interface BattleResult {
  success: boolean;
  damage?: number;
  effects?: string[];
  monsterCaught?: boolean;
  experienceGained?: number;
  battleEnded?: boolean;
  winner?: 'player' | 'opponent' | 'draw';
}

export interface StatModifiers {
  attack?: number;
  defense?: number;
  specialAttack?: number;
  specialDefense?: number;
  speed?: number;
}

export interface BattleContext {
  playerMonster: MonsterInstance;
  opponentMonster: MonsterInstance;
  playerStatModifiers: StatModifiers;
  opponentStatModifiers: StatModifiers;
}

// Type effectiveness chart
export const TYPE_EFFECTIVENESS: Record<MonsterType, Record<MonsterType, number>> = {
  [MonsterType.FIRE]: {
    [MonsterType.FIRE]: 0.5, // Fire is not very effective against Fire
    [MonsterType.WATER]: 0.5, // Fire is not very effective against Water
  },
  [MonsterType.WATER]: {
    [MonsterType.FIRE]: 2.0, // Water is super effective against Fire
    [MonsterType.WATER]: 0.5, // Water is not very effective against Water
  },
};
