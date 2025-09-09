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
  abilities: string[];
  learnableMoves: string[];
  description: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
}

export interface MonsterInstance {
  id: string;
  monsterId: string;
  name: string;
  level: number;
  currentHp: number;
  maxHp: number;
  stats: MonsterStats;
  moves: string[];
  movePP: Record<string, number>; // current PP for each move
  ability: string;
  experience: number;
  isShiny?: boolean;
  // Client-side only properties for display
  statModifiers?: StatModifiers;
}

export interface Item {
  id: string;
  name: string;
  description: string;
  type: 'healing' | 'capture' | 'battle' | 'misc' | 'permanent';
  effect: string;
  quantity: number;
  rarity?: 'common' | 'uncommon' | 'rare' | 'legendary';
  value?: number;
}

export interface GameRun {
  id: string;
  playerId: string;
  currentStage: number;
  team: MonsterInstance[];
  inventory: Item[];
  currency: number;
  isActive: boolean;
  createdAt: string;
  endedAt?: string;
  permanentItems?: string[]; // Array of permanent item IDs
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
    usedStatBoosts?: {
      attack?: boolean;
      defense?: boolean;
      speed?: boolean;
    };
  };
}

export interface Player {
  id: string;
  username: string;
  permanentCurrency: number;
  unlockedStarters: string[];
  unlockedAbilities: string[];
  totalRuns: number;
  bestStage: number;
  createdAt: string;
}

export interface BattleAction {
  type: 'attack' | 'catch' | 'item' | 'switch' | 'flee';
  moveId?: string;
  targetId?: string;
  itemId?: string;
  newMonsterId?: string;
  targetMoveId?: string; // For items that target specific moves (like Ether)
}

export interface BattleResult {
  success: boolean;
  damage?: number;
  isCritical?: boolean;
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

export interface Encounter {
  type: 'wild_monster' | 'trainer' | 'item' | 'rest_site';
  data?: any;
}

export interface ProgressStageResponse {
  run: GameRun;
  encounter: Encounter | null;
  gameEnded: boolean;
  reason?: 'victory' | 'defeat';
  message?: string;
}

export interface BattleActionResponse {
  result: BattleResult;
  updatedPlayerMonster: MonsterInstance;
  updatedOpponentMonster: MonsterInstance;
  updatedRun: GameRun;
  teamWipe?: boolean;
  battleContext?: {
    playerStatModifiers: StatModifiers;
    opponentStatModifiers: StatModifiers;
  };
}

export interface BattleInitResponse {
  effects: string[];
  playerGoesFirst: boolean;
  updatedPlayerMonster: MonsterInstance;
  updatedOpponentMonster: MonsterInstance;
  battleContext: {
    playerStatModifiers: StatModifiers;
    opponentStatModifiers: StatModifiers;
  };
}
