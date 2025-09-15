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
  effect_chance?: number;
}

export enum StatusEffect {
  POISON = 'poison',
  BURN = 'burn',
  PARALYZE = 'paralyze',
  FROSTBITE = 'frostbite',
  SLEEP = 'sleep',
  BADLY_POISONED = 'badly_poisoned',
  BADLY_BURN = 'badly_burn',
  CONFUSION = 'confusion'
}

export interface StatusCondition {
  effect: StatusEffect;
  duration?: number;
  turnsActive?: number;
}

export interface Monster {
  id: string;
  name: string;
  type: MonsterType[];
  baseStats: MonsterStats;
  abilities: string[];
  learnableMoves: [string, number][]; // [move_id, level_learned] tuples
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
  statusCondition?: StatusCondition; // Single status effect affecting this monster
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
  price?: number;
  isBuyable?: boolean;
  battleUsable?: boolean;
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
  monsterSwitched?: boolean;
  experienceGained?: number;
  battleEnded?: boolean;
  winner?: 'player' | 'opponent' | 'draw';
  requiresAutoSwitch?: boolean; // Indicates player monster died and has other monsters available
  moveLearnEvents?: MoveLearnEvent[]; // New moves learned during level up that require choice
  autoLearnedMoves?: string[]; // Moves automatically learned (when < 4 moves)
}

export interface MoveLearnEvent {
  monsterId: string;
  newMove: string;
  level: number;
  canLearn: boolean; // false if monster already has 4 moves
  currentMoves?: string[]; // current moves if canLearn is false
}

export interface MoveSelectionRequest {
  monsterId: string;
  newMove: string;
  selectedMoveToReplace?: string;
  learnMove: boolean; // true to learn, false to skip
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
  playerGoesFirst?: boolean;
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
