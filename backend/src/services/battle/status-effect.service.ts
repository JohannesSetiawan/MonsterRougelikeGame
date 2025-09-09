import { Injectable } from '@nestjs/common';
import { MonsterInstance, StatusEffect, StatusCondition } from '../../types';
import { STATUS_EFFECT_CONFIGS } from './status-effect.types';

@Injectable()
export class StatusEffectService {
  
  /**
   * Apply status effect damage at the end of turn
   */
  applyStatusDamage(monster: MonsterInstance): { damage: number; effects: string[] } {
    const effects: string[] = [];
    let totalDamage = 0;

    if (!monster.statusConditions || monster.statusConditions.length === 0) {
      return { damage: 0, effects: [] };
    }

    for (const condition of monster.statusConditions) {
      const config = STATUS_EFFECT_CONFIGS[condition.effect];
      
      if (config.damagePercentage) {
        const damage = Math.floor(monster.maxHp * config.damagePercentage);
        totalDamage += damage;
        
        switch (condition.effect) {
          case StatusEffect.POISON:
            effects.push(`${monster.name} is hurt by poison! (${damage} damage)`);
            break;
          case StatusEffect.BURN:
            effects.push(`${monster.name} is hurt by burn! (${damage} damage)`);
            break;
          case StatusEffect.FROSTBITE:
            effects.push(`${monster.name} is hurt by frostbite! (${damage} damage)`);
            break;
          case StatusEffect.BADLY_POISONED:
            effects.push(`${monster.name} is badly poisoned! (${damage} damage)`);
            break;
          case StatusEffect.BADLY_BURN:
            effects.push(`${monster.name} is badly burned! (${damage} damage)`);
            break;
        }
      }
    }

    // Apply damage to monster
    if (totalDamage > 0) {
      monster.currentHp = Math.max(0, monster.currentHp - totalDamage);
    }

    return { damage: totalDamage, effects };
  }

  /**
   * Check if monster should skip turn due to status effects
   */
  shouldSkipTurn(monster: MonsterInstance): { skip: boolean; reason?: string } {
    if (!monster.statusConditions || monster.statusConditions.length === 0) {
      return { skip: false };
    }

    for (const condition of monster.statusConditions) {
      const config = STATUS_EFFECT_CONFIGS[condition.effect];
      
      if (config.skipTurnChance && Math.random() < config.skipTurnChance) {
        switch (condition.effect) {
          case StatusEffect.PARALYZE:
            return { skip: true, reason: `${monster.name} is paralyzed and can't move!` };
          case StatusEffect.FROSTBITE:
            return { skip: true, reason: `${monster.name} is frozen and can't move!` };
          case StatusEffect.SLEEP:
            return { skip: true, reason: `${monster.name} is fast asleep!` };
        }
      }
    }

    return { skip: false };
  }

  /**
   * Check if attacking move should hit self due to confusion
   */
  shouldHitSelf(monster: MonsterInstance): { hitSelf: boolean; reason?: string } {
    if (!monster.statusConditions || monster.statusConditions.length === 0) {
      return { hitSelf: false };
    }

    const confusionCondition = monster.statusConditions.find(c => c.effect === StatusEffect.CONFUSION);
    if (confusionCondition) {
      const config = STATUS_EFFECT_CONFIGS[StatusEffect.CONFUSION];
      if (config.confusionChance && Math.random() < config.confusionChance) {
        return { 
          hitSelf: true, 
          reason: `${monster.name} is confused and hurt itself in its confusion!` 
        };
      }
    }

    return { hitSelf: false };
  }

  /**
   * Apply stat modifications from status effects
   */
  getStatusModifiedStats(monster: MonsterInstance): {
    attack: number;
    defense: number;
    specialAttack: number;
    specialDefense: number;
    speed: number;
  } {
    let modifiers = {
      attack: 1,
      defense: 1,
      specialAttack: 1,
      specialDefense: 1,
      speed: 1
    };

    if (!monster.statusConditions || monster.statusConditions.length === 0) {
      return {
        attack: monster.stats.attack,
        defense: monster.stats.defense,
        specialAttack: monster.stats.specialAttack,
        specialDefense: monster.stats.specialDefense,
        speed: monster.stats.speed
      };
    }

    for (const condition of monster.statusConditions) {
      const config = STATUS_EFFECT_CONFIGS[condition.effect];
      
      if (config.attackReduction) {
        modifiers.attack *= (1 - config.attackReduction);
      }
      if (config.defenseReduction) {
        modifiers.defense *= (1 - config.defenseReduction);
      }
      if (config.specialAttackReduction) {
        modifiers.specialAttack *= (1 - config.specialAttackReduction);
      }
      if (config.specialDefenseReduction) {
        modifiers.specialDefense *= (1 - config.specialDefenseReduction);
      }
      if (config.speedReduction) {
        modifiers.speed *= (1 - config.speedReduction);
      }
    }

    return {
      attack: Math.floor(monster.stats.attack * modifiers.attack),
      defense: Math.floor(monster.stats.defense * modifiers.defense),
      specialAttack: Math.floor(monster.stats.specialAttack * modifiers.specialAttack),
      specialDefense: Math.floor(monster.stats.specialDefense * modifiers.specialDefense),
      speed: Math.floor(monster.stats.speed * modifiers.speed)
    };
  }

  /**
   * Process natural recovery from status effects
   */
  processStatusRecovery(monster: MonsterInstance): { cured: StatusEffect[]; effects: string[] } {
    if (!monster.statusConditions || monster.statusConditions.length === 0) {
      return { cured: [], effects: [] };
    }

    const cured: StatusEffect[] = [];
    const effects: string[] = [];
    
    monster.statusConditions = monster.statusConditions.filter(condition => {
      const config = STATUS_EFFECT_CONFIGS[condition.effect];
      
      // Increment turns active
      condition.turnsActive = (condition.turnsActive || 0) + 1;
      
      if (config.cureChance && Math.random() < config.cureChance) {
        cured.push(condition.effect);
        
        switch (condition.effect) {
          case StatusEffect.SLEEP:
            effects.push(`${monster.name} woke up!`);
            break;
        }
        
        return false; // Remove this condition
      }
      
      return true; // Keep this condition
    });

    return { cured, effects };
  }

  /**
   * Add a status effect to a monster
   */
  addStatusEffect(monster: MonsterInstance, effect: StatusEffect): { success: boolean; message: string } {
    if (!monster.statusConditions) {
      monster.statusConditions = [];
    }

    // Check if monster already has this status effect
    const existing = monster.statusConditions.find(c => c.effect === effect);
    if (existing) {
      return { success: false, message: `${monster.name} is already affected by ${effect}!` };
    }

    // Some status effects are mutually exclusive
    if (effect === StatusEffect.SLEEP) {
      // Can't sleep if paralyzed or frozen
      const hasParalysis = monster.statusConditions.some(c => c.effect === StatusEffect.PARALYZE);
      const hasFrostbite = monster.statusConditions.some(c => c.effect === StatusEffect.FROSTBITE);
      if (hasParalysis || hasFrostbite) {
        return { success: false, message: `${monster.name} can't fall asleep in its current condition!` };
      }
    }

    monster.statusConditions.push({
      effect,
      turnsActive: 0
    });

    let message = '';
    switch (effect) {
      case StatusEffect.POISON:
        message = `${monster.name} was poisoned!`;
        break;
      case StatusEffect.BURN:
        message = `${monster.name} was burned!`;
        break;
      case StatusEffect.PARALYZE:
        message = `${monster.name} was paralyzed!`;
        break;
      case StatusEffect.FROSTBITE:
        message = `${monster.name} was frozen!`;
        break;
      case StatusEffect.SLEEP:
        message = `${monster.name} fell asleep!`;
        break;
      case StatusEffect.BADLY_POISONED:
        message = `${monster.name} was badly poisoned!`;
        break;
      case StatusEffect.BADLY_BURN:
        message = `${monster.name} was badly burned!`;
        break;
      case StatusEffect.CONFUSION:
        message = `${monster.name} became confused!`;
        break;
    }

    return { success: true, message };
  }

  /**
   * Remove a specific status effect
   */
  removeStatusEffect(monster: MonsterInstance, effect: StatusEffect): boolean {
    if (!monster.statusConditions) {
      return false;
    }

    const initialLength = monster.statusConditions.length;
    monster.statusConditions = monster.statusConditions.filter(c => c.effect !== effect);
    return monster.statusConditions.length < initialLength;
  }

  /**
   * Clear all status effects
   */
  clearAllStatusEffects(monster: MonsterInstance): void {
    monster.statusConditions = [];
  }

  /**
   * Check if monster has a specific status effect
   */
  hasStatusEffect(monster: MonsterInstance, effect: StatusEffect): boolean {
    if (!monster.statusConditions) {
      return false;
    }
    return monster.statusConditions.some(c => c.effect === effect);
  }
}
