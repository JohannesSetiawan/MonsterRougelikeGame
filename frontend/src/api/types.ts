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
}

export interface Item {
  id: string;
  name: string;
  description: string;
  type: 'healing' | 'capture' | 'battle' | 'misc';
  effect: string;
  quantity: number;
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
}
