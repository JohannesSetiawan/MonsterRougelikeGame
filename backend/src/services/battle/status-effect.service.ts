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

    if (!monster.statusCondition) {
      return { damage: 0, effects: [] };
    }

    const condition = monster.statusCondition;
    const config = STATUS_EFFECT_CONFIGS[condition.effect];
    
    if (config.damagePercentage) {
      const damage = Math.max(1, Math.floor(monster.maxHp * config.damagePercentage));
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
    if (!monster.statusCondition) {
      return { skip: false };
    }

    const condition = monster.statusCondition;
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

    return { skip: false };
  }

  /**
   * Check if attacking move should hit self due to confusion
   */
  shouldHitSelf(monster: MonsterInstance): { hitSelf: boolean; reason?: string } {
    if (!monster.statusCondition) {
      return { hitSelf: false };
    }

    if (monster.statusCondition.effect === StatusEffect.CONFUSION) {
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

    if (!monster.statusCondition) {
      return {
        attack: monster.stats.attack,
        defense: monster.stats.defense,
        specialAttack: monster.stats.specialAttack,
        specialDefense: monster.stats.specialDefense,
        speed: monster.stats.speed
      };
    }

    const condition = monster.statusCondition;
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
    if (!monster.statusCondition) {
      return { cured: [], effects: [] };
    }

    const condition = monster.statusCondition;
    const config = STATUS_EFFECT_CONFIGS[condition.effect];
    
    // Increment turns active
    condition.turnsActive = (condition.turnsActive || 0) + 1;
    
    if (config.cureChance && Math.random() < config.cureChance) {
      const effect = condition.effect;
      let message = '';
      
      switch (effect) {
        case StatusEffect.SLEEP:
          message = `${monster.name} woke up!`;
          break;
      }
      
      // Clear the status condition
      monster.statusCondition = undefined;
      
      return { cured: [effect], effects: message ? [message] : [] };
    }

    return { cured: [], effects: [] };
  }

  /**
   * Add a status effect to a monster
   */
  addStatusEffect(monster: MonsterInstance, effect: StatusEffect): { success: boolean; message: string } {
    // Check if monster already has any status effect (Pokemon-like behavior)
    if (monster.statusCondition) {
      if (monster.statusCondition.effect === effect) {
        return { success: false, message: `${monster.name} is already affected by ${effect}!` };
      } else {
        return { success: false, message: `${monster.name} is already affected by a status condition!` };
      }
    }

    // Apply the new status effect (only if monster has no existing status)
    monster.statusCondition = {
      effect,
      turnsActive: 0
    };

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
    if (!monster.statusCondition || monster.statusCondition.effect !== effect) {
      return false;
    }

    monster.statusCondition = undefined;
    return true;
  }

  /**
   * Clear all status effects
   */
  clearAllStatusEffects(monster: MonsterInstance): void {
    monster.statusCondition = undefined;
  }

  /**
   * Clear only confusion status effect
   */
  clearConfusion(monster: MonsterInstance): void {
    if (monster.statusCondition?.effect === StatusEffect.CONFUSION) {
      monster.statusCondition = undefined;
    }
  }

  /**
   * Check if monster has a specific status effect
   */
  hasStatusEffect(monster: MonsterInstance, effect: StatusEffect): boolean {
    return monster.statusCondition?.effect === effect;
  }
}
