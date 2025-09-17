export enum MonsterType {
  FIRE = 'fire',
  WATER = 'water',
  NORMAL = 'normal',
  FIGHTING = 'fighting',
  FLYING = 'flying',
  GRASS = 'grass',
  POISON = 'poison',
  ELECTRIC = 'electric',
  GROUND = 'ground',
  PSYCHIC = 'psychic',
  ROCK = 'rock',
  ICE = 'ice',
  BUG = 'bug',
  DRAGON = 'dragon',
  GHOST = 'ghost',
  DARK = 'dark',
  STEEL = 'steel',
  FAIRY = 'fairy',
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
  target?: 'user' | 'opponent';
}

export interface Monster {
  id: string;
  name: string;
  type: MonsterType[];
  baseStats: MonsterStats;
  abilities: string[]; // ability ids
  learnableMoves: [string, number][]; // [move_id, level_learned] tuples
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
  statusCondition?: StatusCondition; // Single status effect affecting this monster
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
  duration?: number; // For effects that can last multiple turns
  turnsActive?: number; // How many turns this effect has been active
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
  requiresAutoSwitch?: boolean;
  moveLearnEvents?: MoveLearnEvent[]; // New moves learned during level up
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

export interface BattleContext {
  playerMonster: MonsterInstance;
  opponentMonster: MonsterInstance;
  playerStatModifiers: StatModifiers;
  opponentStatModifiers: StatModifiers;
}

// Type effectiveness chart
export const TYPE_EFFECTIVENESS: Record<MonsterType, Record<MonsterType, number>> = {
  [MonsterType.FIRE]: {
    [MonsterType.FIRE]: 0.5, 
    [MonsterType.WATER]: 0.5,
    [MonsterType.NORMAL]: 1.0,
    [MonsterType.FIGHTING]: 1.0,
    [MonsterType.FLYING]: 1.0,
    [MonsterType.GRASS]: 2.0,
    [MonsterType.POISON]: 1.0,
    [MonsterType.ELECTRIC]: 1.0,
    [MonsterType.GROUND]: 1.0,
    [MonsterType.PSYCHIC]: 1.0,
    [MonsterType.ROCK]: 0.5,
    [MonsterType.ICE]: 2.0,
    [MonsterType.BUG]: 2.0,
    [MonsterType.DRAGON]: 0.5,
    [MonsterType.GHOST]: 1.0,
    [MonsterType.DARK]: 1.0,
    [MonsterType.STEEL]: 2.0,
    [MonsterType.FAIRY]: 1.0,
  },
  [MonsterType.WATER]: {
    [MonsterType.FIRE]: 2.0,
    [MonsterType.WATER]: 0.5,
    [MonsterType.NORMAL]: 1.0,
    [MonsterType.FIGHTING]: 1.0,
    [MonsterType.FLYING]: 1.0,
    [MonsterType.GRASS]: 0.5,
    [MonsterType.POISON]: 1.0,
    [MonsterType.ELECTRIC]: 1.0,
    [MonsterType.GROUND]: 2.0, 
    [MonsterType.PSYCHIC]: 1.0,
    [MonsterType.ROCK]: 2.0, 
    [MonsterType.ICE]: 1.0,
    [MonsterType.BUG]: 1.0,
    [MonsterType.DRAGON]: 0.5, 
    [MonsterType.GHOST]: 1.0,
    [MonsterType.DARK]: 1.0,
    [MonsterType.STEEL]: 1.0,
    [MonsterType.FAIRY]: 1.0,
  },
  [MonsterType.NORMAL]: {
    [MonsterType.FIRE]: 1.0,
    [MonsterType.WATER]: 1.0,
    [MonsterType.NORMAL]: 1.0,
    [MonsterType.FIGHTING]: 1.0,
    [MonsterType.FLYING]: 1.0,
    [MonsterType.GRASS]: 1.0,
    [MonsterType.POISON]: 1.0,
    [MonsterType.ELECTRIC]: 1.0,
    [MonsterType.GROUND]: 1.0,
    [MonsterType.PSYCHIC]: 1.0,
    [MonsterType.ROCK]: 0.5,
    [MonsterType.ICE]: 1.0,
    [MonsterType.BUG]: 1.0,
    [MonsterType.DRAGON]: 1.0,
    [MonsterType.GHOST]: 0.0,
    [MonsterType.DARK]: 1.0,
    [MonsterType.STEEL]: 0.5,
    [MonsterType.FAIRY]: 1.0,
  },
  [MonsterType.FIGHTING]: {
    [MonsterType.FIRE]: 1.0,
    [MonsterType.WATER]: 1.0,
    [MonsterType.NORMAL]: 2.0,
    [MonsterType.FIGHTING]: 1.0,
    [MonsterType.FLYING]: 0.5,
    [MonsterType.GRASS]: 1.0,
    [MonsterType.POISON]: 0.5,
    [MonsterType.ELECTRIC]: 1.0,
    [MonsterType.GROUND]: 1.0,
    [MonsterType.PSYCHIC]: 0.5,
    [MonsterType.ROCK]: 2.0,
    [MonsterType.ICE]: 2.0,
    [MonsterType.BUG]: 0.5,
    [MonsterType.DRAGON]: 1.0,
    [MonsterType.GHOST]: 0.0,
    [MonsterType.DARK]: 2.0,
    [MonsterType.STEEL]: 2.0,
    [MonsterType.FAIRY]: 0.5,
  },
  [MonsterType.FLYING]: {
    [MonsterType.FIRE]: 1.0,
    [MonsterType.WATER]: 1.0,
    [MonsterType.NORMAL]: 1.0,
    [MonsterType.FIGHTING]: 2.0,
    [MonsterType.FLYING]: 1.0,
    [MonsterType.GRASS]: 2.0,
    [MonsterType.POISON]: 1.0,
    [MonsterType.ELECTRIC]: 0.5,
    [MonsterType.GROUND]: 1.0,
    [MonsterType.PSYCHIC]: 1.0,
    [MonsterType.ROCK]: 0.5,
    [MonsterType.ICE]: 1.0,
    [MonsterType.BUG]: 2.0,
    [MonsterType.DRAGON]: 1.0,
    [MonsterType.GHOST]: 1.0,
    [MonsterType.DARK]: 1.0,
    [MonsterType.STEEL]: 0.5,
    [MonsterType.FAIRY]: 1.0,
  },
  [MonsterType.GRASS]: {
    [MonsterType.FIRE]: 0.5,
    [MonsterType.WATER]: 2.0,
    [MonsterType.NORMAL]: 1.0,
    [MonsterType.FIGHTING]: 1.0,
    [MonsterType.FLYING]: 0.5,
    [MonsterType.GRASS]: 0.5,
    [MonsterType.POISON]: 0.5,
    [MonsterType.ELECTRIC]: 1.0,
    [MonsterType.GROUND]: 2.0,
    [MonsterType.PSYCHIC]: 1.0,
    [MonsterType.ROCK]: 2.0,
    [MonsterType.ICE]: 1.0,
    [MonsterType.BUG]: 0.5,
    [MonsterType.DRAGON]: 0.5,
    [MonsterType.GHOST]: 1.0,
    [MonsterType.DARK]: 1.0,
    [MonsterType.STEEL]: 0.5,
    [MonsterType.FAIRY]: 1.0,
  },
  [MonsterType.POISON]: {
    [MonsterType.FIRE]: 1.0,
    [MonsterType.WATER]: 1.0,
    [MonsterType.NORMAL]: 1.0,
    [MonsterType.FIGHTING]: 1.0,
    [MonsterType.FLYING]: 1.0,
    [MonsterType.GRASS]: 2.0,
    [MonsterType.POISON]: 0.5,
    [MonsterType.ELECTRIC]: 1.0,
    [MonsterType.GROUND]: 0.5,
    [MonsterType.PSYCHIC]: 1.0,
    [MonsterType.ROCK]: 0.5,
    [MonsterType.ICE]: 1.0,
    [MonsterType.BUG]: 1.0,
    [MonsterType.DRAGON]: 1.0,
    [MonsterType.GHOST]: 0.5,
    [MonsterType.DARK]: 1.0,
    [MonsterType.STEEL]: 0.0,
    [MonsterType.FAIRY]: 2.0,
  },
  [MonsterType.ELECTRIC]: {
    [MonsterType.FIRE]: 1.0,
    [MonsterType.WATER]: 2.0,
    [MonsterType.NORMAL]: 1.0,
    [MonsterType.FIGHTING]: 1.0,
    [MonsterType.FLYING]: 2.0,
    [MonsterType.GRASS]: 0.5,
    [MonsterType.POISON]: 1.0,
    [MonsterType.ELECTRIC]: 0.5,
    [MonsterType.GROUND]: 0.0,
    [MonsterType.PSYCHIC]: 1.0,
    [MonsterType.ROCK]: 1.0,
    [MonsterType.ICE]: 1.0,
    [MonsterType.BUG]: 1.0,
    [MonsterType.DRAGON]: 0.5,
    [MonsterType.GHOST]: 1.0,
    [MonsterType.DARK]: 1.0,
    [MonsterType.STEEL]: 1.0,
    [MonsterType.FAIRY]: 1.0,
  },
  [MonsterType.GROUND]: {
    [MonsterType.FIRE]: 2.0,
    [MonsterType.WATER]: 1.0,
    [MonsterType.NORMAL]: 1.0,
    [MonsterType.FIGHTING]: 1.0,
    [MonsterType.FLYING]: 0.0,
    [MonsterType.GRASS]: 0.5,
    [MonsterType.POISON]: 2.0,
    [MonsterType.ELECTRIC]: 2.0,
    [MonsterType.GROUND]: 1.0,
    [MonsterType.PSYCHIC]: 1.0,
    [MonsterType.ROCK]: 2.0,
    [MonsterType.ICE]: 1.0,
    [MonsterType.BUG]: 0.5,
    [MonsterType.DRAGON]: 1.0,
    [MonsterType.GHOST]: 1.0,
    [MonsterType.DARK]: 1.0,
    [MonsterType.STEEL]: 2.0,
    [MonsterType.FAIRY]: 1.0,
  },
  [MonsterType.PSYCHIC]: {
    [MonsterType.FIRE]: 1.0,
    [MonsterType.WATER]: 1.0,
    [MonsterType.NORMAL]: 1.0,
    [MonsterType.FIGHTING]: 2.0,
    [MonsterType.FLYING]: 1.0,
    [MonsterType.GRASS]: 1.0,
    [MonsterType.POISON]: 2.0,
    [MonsterType.ELECTRIC]: 1.0,
    [MonsterType.GROUND]: 1.0,
    [MonsterType.PSYCHIC]: 0.5,
    [MonsterType.ROCK]: 1.0,
    [MonsterType.ICE]: 1.0,
    [MonsterType.BUG]: 1.0,
    [MonsterType.DRAGON]: 1.0,
    [MonsterType.GHOST]: 1.0,
    [MonsterType.DARK]: 0.0,
    [MonsterType.STEEL]: 0.5,
    [MonsterType.FAIRY]: 1.0,
  },
  [MonsterType.ROCK]: {
    [MonsterType.FIRE]: 2.0,
    [MonsterType.WATER]: 1.0,
    [MonsterType.NORMAL]: 1.0,
    [MonsterType.FIGHTING]: 0.5,
    [MonsterType.FLYING]: 2.0,
    [MonsterType.GRASS]: 1.0,
    [MonsterType.POISON]: 1.0,
    [MonsterType.ELECTRIC]: 1.0,
    [MonsterType.GROUND]: 0.5,
    [MonsterType.PSYCHIC]: 1.0,
    [MonsterType.ROCK]: 1.0,
    [MonsterType.ICE]: 2.0,
    [MonsterType.BUG]: 2.0,
    [MonsterType.DRAGON]: 1.0,
    [MonsterType.GHOST]: 1.0,
    [MonsterType.DARK]: 1.0,
    [MonsterType.STEEL]: 0.5,
    [MonsterType.FAIRY]: 1.0,
  },
  [MonsterType.ICE]: {
    [MonsterType.FIRE]: 0.5,
    [MonsterType.WATER]: 0.5,
    [MonsterType.NORMAL]: 1.0,
    [MonsterType.FIGHTING]: 1.0,
    [MonsterType.FLYING]: 2.0,
    [MonsterType.GRASS]: 2.0,
    [MonsterType.POISON]: 1.0,
    [MonsterType.ELECTRIC]: 1.0,
    [MonsterType.GROUND]: 2.0,
    [MonsterType.PSYCHIC]: 1.0,
    [MonsterType.ROCK]: 1.0,
    [MonsterType.ICE]: 0.5,
    [MonsterType.BUG]: 1.0,
    [MonsterType.DRAGON]: 2.0,
    [MonsterType.GHOST]: 1.0,
    [MonsterType.DARK]: 1.0,
    [MonsterType.STEEL]: 0.5,
    [MonsterType.FAIRY]: 1.0,
  },
  [MonsterType.BUG]: {
    [MonsterType.FIRE]: 0.5,
    [MonsterType.WATER]: 1.0,
    [MonsterType.NORMAL]: 1.0,
    [MonsterType.FIGHTING]: 0.5,
    [MonsterType.FLYING]: 0.5,
    [MonsterType.GRASS]: 2.0,
    [MonsterType.POISON]: 0.5,
    [MonsterType.ELECTRIC]: 1.0,
    [MonsterType.GROUND]: 1.0,
    [MonsterType.PSYCHIC]: 2.0,
    [MonsterType.ROCK]: 1.0,
    [MonsterType.ICE]: 1.0,
    [MonsterType.BUG]: 1.0,
    [MonsterType.DRAGON]: 1.0,
    [MonsterType.GHOST]: 0.5,
    [MonsterType.DARK]: 2.0,
    [MonsterType.STEEL]: 0.5,
    [MonsterType.FAIRY]: 0.5,
  },
  [MonsterType.DRAGON]: {
    [MonsterType.FIRE]: 1.0,
    [MonsterType.WATER]: 1.0,
    [MonsterType.NORMAL]: 1.0,
    [MonsterType.FIGHTING]: 1.0,
    [MonsterType.FLYING]: 1.0,
    [MonsterType.GRASS]: 1.0,
    [MonsterType.POISON]: 1.0,
    [MonsterType.ELECTRIC]: 1.0,
    [MonsterType.GROUND]: 1.0,
    [MonsterType.PSYCHIC]: 1.0,
    [MonsterType.ROCK]: 1.0,
    [MonsterType.ICE]: 1.0,
    [MonsterType.BUG]: 1.0,
    [MonsterType.DRAGON]: 2.0,
    [MonsterType.GHOST]: 1.0,
    [MonsterType.DARK]: 1.0,
    [MonsterType.STEEL]: 0.5,
    [MonsterType.FAIRY]: 0.0,
  },
  [MonsterType.GHOST]: {
    [MonsterType.FIRE]: 1.0,
    [MonsterType.WATER]: 1.0,
    [MonsterType.NORMAL]: 0.0,
    [MonsterType.FIGHTING]: 1.0,
    [MonsterType.FLYING]: 1.0,
    [MonsterType.GRASS]: 1.0,
    [MonsterType.POISON]: 1.0,
    [MonsterType.ELECTRIC]: 1.0,
    [MonsterType.GROUND]: 1.0,
    [MonsterType.PSYCHIC]: 2.0,
    [MonsterType.ROCK]: 1.0,
    [MonsterType.ICE]: 1.0,
    [MonsterType.BUG]: 1.0,
    [MonsterType.DRAGON]: 1.0,
    [MonsterType.GHOST]: 2.0,
    [MonsterType.DARK]: 0.5,
    [MonsterType.STEEL]: 1.0,
    [MonsterType.FAIRY]: 1.0,
  },
  [MonsterType.DARK]: {
    [MonsterType.FIRE]: 1.0,
    [MonsterType.WATER]: 1.0,
    [MonsterType.NORMAL]: 1.0,
    [MonsterType.FIGHTING]: 0.5,
    [MonsterType.FLYING]: 1.0,
    [MonsterType.GRASS]: 1.0,
    [MonsterType.POISON]: 1.0,
    [MonsterType.ELECTRIC]: 1.0,
    [MonsterType.GROUND]: 1.0,
    [MonsterType.PSYCHIC]: 2.0,
    [MonsterType.ROCK]: 1.0,
    [MonsterType.ICE]: 1.0,
    [MonsterType.BUG]: 1.0,
    [MonsterType.DRAGON]: 1.0,
    [MonsterType.GHOST]: 2.0,
    [MonsterType.DARK]: 0.5,
    [MonsterType.STEEL]: 1.0,
    [MonsterType.FAIRY]: 0.5,
  },
  [MonsterType.STEEL]: {
    [MonsterType.FIRE]: 0.5,
    [MonsterType.WATER]: 0.5,
    [MonsterType.NORMAL]: 1.0,
    [MonsterType.FIGHTING]: 1.0,
    [MonsterType.FLYING]: 1.0,
    [MonsterType.GRASS]: 1.0,
    [MonsterType.POISON]: 1.0,
    [MonsterType.ELECTRIC]: 0.5,
    [MonsterType.GROUND]: 1.0,
    [MonsterType.PSYCHIC]: 1.0,
    [MonsterType.ROCK]: 2.0,
    [MonsterType.ICE]: 2.0,
    [MonsterType.BUG]: 1.0,
    [MonsterType.DRAGON]: 1.0,
    [MonsterType.GHOST]: 1.0,
    [MonsterType.DARK]: 1.0,
    [MonsterType.STEEL]: 0.5,
    [MonsterType.FAIRY]: 2.0,
  },
  [MonsterType.FAIRY]: {
    [MonsterType.FIRE]: 0.5,
    [MonsterType.WATER]: 1.0,
    [MonsterType.NORMAL]: 1.0,
    [MonsterType.FIGHTING]: 2.0,
    [MonsterType.FLYING]: 1.0,
    [MonsterType.GRASS]: 1.0,
    [MonsterType.POISON]: 0.5,
    [MonsterType.ELECTRIC]: 1.0,
    [MonsterType.GROUND]: 1.0,
    [MonsterType.PSYCHIC]: 1.0,
    [MonsterType.ROCK]: 1.0,
    [MonsterType.ICE]: 1.0,
    [MonsterType.BUG]: 1.0,
    [MonsterType.DRAGON]: 2.0,
    [MonsterType.GHOST]: 1.0,
    [MonsterType.DARK]: 2.0,
    [MonsterType.STEEL]: 0.5,
    [MonsterType.FAIRY]: 1.0,
  },
};
