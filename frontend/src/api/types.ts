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

export interface MoveEffect {
  effect: string;
  chance: number;
  target: 'user' | 'opponent';
}

export enum TwoTurnMoveType {
  CHARGING = 'charging',
  SEMI_INVULNERABLE = 'semi_invulnerable'
}

export interface TwoTurnMoveData {
  type: TwoTurnMoveType;
  chargingMessage?: string;
  rechargeRequired?: boolean;
  semiInvulnerableState?: string;
  counterMoves?: string[];
}

export interface TwoTurnMoveState {
  moveId: string;
  phase: 'charging' | 'executing' | 'recharging';
  semiInvulnerableState?: string;
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
  target?: 'user' | 'opponent'; // For moves without effects, to indicate basic targeting
  effects?: MoveEffect[]; // Multi-effect system - optional for moves without effects
  twoTurnMove?: TwoTurnMoveData; // Two-turn move data
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

export enum Weather {
  HARSH_SUNLIGHT = 'harsh_sunlight',
  RAIN = 'rain',
  SANDSTORM = 'sandstorm',
  HAIL = 'hail',
  FOG = 'fog',
  STRONG_WINDS = 'strong_winds'
}

export interface WeatherCondition {
  weather: Weather;
  turnsRemaining?: number;
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
  twoTurnMoveState?: TwoTurnMoveState; // State for two-turn moves
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
  attack?: number; // Now represents stages (-6 to +6)
  defense?: number; // Now represents stages (-6 to +6)
  specialAttack?: number; // Now represents stages (-6 to +6)
  specialDefense?: number; // Now represents stages (-6 to +6)
  speed?: number; // Now represents stages (-6 to +6)
}

// Utility functions for stage-based stat calculations
export class StatStageCalculator {
  /**
   * Convert stat stages to multiplier based on the formula:
   * Positive stages: (2 + stages) / 2
   * Negative stages: 2 / (2 + abs(stages))
   * Stage 0: 1.0 (no change)
   */
  static stageToMultiplier(stage: number): number {
    // Clamp stage to valid range (-6 to +6)
    stage = Math.max(-6, Math.min(6, stage));
    
    if (stage === 0) {
      return 1.0;
    } else if (stage > 0) {
      return (2 + stage) / 2;
    } else {
      return 2 / (2 + Math.abs(stage));
    }
  }

  /**
   * Get the multiplier for a specific stat stage
   */
  static getStageMultiplier(stages: StatModifiers, statType: keyof StatModifiers): number {
    const stage = stages[statType] || 0;
    return this.stageToMultiplier(stage);
  }

  /**
   * Add stages to existing stat modifiers (clamped to -6/+6 range)
   */
  static addStages(
    currentModifiers: StatModifiers,
    stagesToAdd: Partial<StatModifiers>
  ): StatModifiers {
    const result = { ...currentModifiers };
    
    for (const [stat, stages] of Object.entries(stagesToAdd)) {
      if (stages !== undefined && stages !== null) {
        const currentStage = result[stat as keyof StatModifiers] || 0;
        const newStage = Math.max(-6, Math.min(6, currentStage + stages));
        result[stat as keyof StatModifiers] = newStage;
      }
    }
    
    return result;
  }
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
    weather?: WeatherCondition;
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
    weather?: WeatherCondition;
  };
}
