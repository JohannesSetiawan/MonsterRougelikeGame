import { StatusEffect, StatusCondition } from '../../types';

export interface StatusEffectConfig {
  damagePercentage?: number;
  skipTurnChance?: number;
  attackReduction?: number;
  specialAttackReduction?: number;
  defenseReduction?: number;
  specialDefenseReduction?: number;
  speedReduction?: number;
  cureChance?: number; // Chance to cure naturally per turn
  confusionChance?: number; // Chance to hit self instead
}

export const STATUS_EFFECT_CONFIGS: Record<StatusEffect, StatusEffectConfig> = {
  [StatusEffect.POISON]: {
    damagePercentage: 0.05, // 5% of max HP
    attackReduction: 0.1, // 10% reduction
    specialAttackReduction: 0.1 // 10% reduction
  },
  [StatusEffect.BURN]: {
    damagePercentage: 0.05, // 5% of max HP
    defenseReduction: 0.1, // 10% reduction
    specialDefenseReduction: 0.1 // 10% reduction
  },
  [StatusEffect.PARALYZE]: {
    skipTurnChance: 0.4, // 40% chance to not act
    speedReduction: 0.1 // 10% speed reduction
  },
  [StatusEffect.FROSTBITE]: {
    skipTurnChance: 0.3, // 30% chance to not act
    damagePercentage: 0.05 // 5% of max HP
  },
  [StatusEffect.SLEEP]: {
    skipTurnChance: 1.0, // 100% chance to not act (can't do anything)
    cureChance: 0.4 // 40% chance to wake up each turn
  },
  [StatusEffect.BADLY_POISONED]: {
    damagePercentage: 0.1, // 10% of max HP
    attackReduction: 0.1, // 10% reduction
    specialAttackReduction: 0.1 // 10% reduction
  },
  [StatusEffect.BADLY_BURN]: {
    damagePercentage: 0.1, // 10% of max HP
    defenseReduction: 0.1, // 10% reduction
    specialDefenseReduction: 0.1 // 10% reduction
  },
  [StatusEffect.CONFUSION]: {
    confusionChance: 0.3 // 30% chance to hit self instead
  }
};
