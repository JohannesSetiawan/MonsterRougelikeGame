import { Injectable } from '@nestjs/common';
import { MonsterInstance, BattleContext, MoveCategory, TYPE_EFFECTIVENESS, StatStageCalculator } from '../../types';
import { MonsterService } from '../monster.service';
import { StatusEffectService } from './status-effect.service';
import { WeatherService } from './weather.service';

@Injectable()
export class DamageCalculationService {
  constructor(
    private monsterService: MonsterService,
    private statusEffectService: StatusEffectService,
    private weatherService: WeatherService
  ) {}

  calculateDamage(
    attacker: MonsterInstance, 
    defender: MonsterInstance, 
    moveId: string,
    battleContext?: BattleContext,
    temporaryBoosts?: {
      attack?: number;
      defense?: number;
      speed?: number;
    }
  ): { damage: number; isCritical: boolean } {
    const move = this.monsterService.getMoveData(moveId);
    const attackerData = this.monsterService.getMonsterData(attacker.monsterId);
    const defenderData = this.monsterService.getMonsterData(defender.monsterId);

    if (!move || move.power === 0) return { damage: 0, isCritical: false };

    // Get base stats with status effect modifiers
    const attackerModifiedStats = this.statusEffectService.getStatusModifiedStats(attacker);
    const defenderModifiedStats = this.statusEffectService.getStatusModifiedStats(defender);

    let attack = move.category === MoveCategory.PHYSICAL 
      ? attackerModifiedStats.attack 
      : attackerModifiedStats.specialAttack;
    
    let defense = move.category === MoveCategory.PHYSICAL 
      ? defenderModifiedStats.defense 
      : defenderModifiedStats.specialDefense;

    // Apply temporary stat boosts from items (X Attack, X Defense, etc.)
    if (temporaryBoosts) {
      const isPlayerAttacker = true; // Assuming player is always the attacker for item boosts
      
      if (isPlayerAttacker && temporaryBoosts.attack && move.category === MoveCategory.PHYSICAL) {
        attack = Math.floor(attack * temporaryBoosts.attack);
      }
      
      if (!isPlayerAttacker && temporaryBoosts.defense && move.category === MoveCategory.PHYSICAL) {
        defense = Math.floor(defense * temporaryBoosts.defense);
      }
    }

    // Apply battle context stat modifiers if available (now stage-based)
    if (battleContext) {
      const isPlayerAttacker = battleContext.playerMonster.id === attacker.id;
      const isPlayerDefender = battleContext.playerMonster.id === defender.id;

      if (isPlayerAttacker) {
        const stage = move.category === MoveCategory.PHYSICAL 
          ? battleContext.playerStatModifiers.attack 
          : battleContext.playerStatModifiers.specialAttack;
        if (stage !== undefined) {
          const multiplier = StatStageCalculator.stageToMultiplier(stage);
          attack = Math.floor(attack * multiplier);
        }
      } else {
        const stage = move.category === MoveCategory.PHYSICAL 
          ? battleContext.opponentStatModifiers.attack 
          : battleContext.opponentStatModifiers.specialAttack;
        if (stage !== undefined) {
          const multiplier = StatStageCalculator.stageToMultiplier(stage);
          attack = Math.floor(attack * multiplier);
        }
      }

      if (isPlayerDefender) {
        const stage = move.category === MoveCategory.PHYSICAL 
          ? battleContext.playerStatModifiers.defense 
          : battleContext.playerStatModifiers.specialDefense;
        if (stage !== undefined) {
          const multiplier = StatStageCalculator.stageToMultiplier(stage);
          defense = Math.floor(defense * multiplier);
        }
      } else {
        const stage = move.category === MoveCategory.PHYSICAL 
          ? battleContext.opponentStatModifiers.defense 
          : battleContext.opponentStatModifiers.specialDefense;
        if (stage !== undefined) {
          const multiplier = StatStageCalculator.stageToMultiplier(stage);
          defense = Math.floor(defense * multiplier);
        }
      }
    }

    // Level factor
    const levelFactor = (2 * attacker.level / 5 + 2);

    // Type effectiveness
    let effectiveness = 1;
    for (const defenderType of defenderData.type) {
      const baseEffectiveness = TYPE_EFFECTIVENESS[move.type]?.[defenderType] ?? 1;
      // Apply weather modifications to type effectiveness
      const weatherModifiedEffectiveness = battleContext?.weather 
        ? this.weatherService.getWeatherTypeEffectivenessMultiplier(
            move.type, 
            defenderType, 
            baseEffectiveness, 
            battleContext.weather
          )
        : baseEffectiveness;
      effectiveness *= weatherModifiedEffectiveness;
    }

    // STAB (Same Type Attack Bonus)
    let stab = attackerData.type.includes(move.type) ? 1.5 : 1;

    // Apply ability effects to damage multipliers
    stab = this.applyAbilityEffectsToStab(attacker, stab, move);

    // Critical hit calculation (1% base chance)
    const criticalHitChance = 0.01;
    const isCritical = Math.random() < criticalHitChance;
    const criticalMultiplier = isCritical ? 2.0 : 1.0;
    
    // Weather power multiplier
    const weatherMultiplier = battleContext?.weather 
      ? this.weatherService.getWeatherMovePowerMultiplier(move, battleContext.weather)
      : 1.0;

    // Random factor (85-100%)
    const randomFactor = (Math.random() * 0.15) + 0.85;

    // Damage calculation
    const baseDamage = ((levelFactor * move.power * attack / defense) / 50 + 2);
    const finalDamage = Math.floor(baseDamage * stab * effectiveness * criticalMultiplier * weatherMultiplier * randomFactor);

    return { damage: Math.max(1, finalDamage), isCritical };
  }

  private applyAbilityEffectsToStab(
    attacker: MonsterInstance, 
    baseSTab: number, 
    move: any
  ): number {
    const abilityData = this.monsterService.getAbilityData(attacker.ability);
    if (!abilityData) return baseSTab;

    const isLowHp = attacker.currentHp / attacker.maxHp <= 0.33; // Low HP threshold
    let modifiedStab = baseSTab;

    switch (abilityData.effect) {
      case 'fire_boost_low_hp':
        // Blaze: Boost Fire-type moves when HP is low
        if (isLowHp && move.type === 'fire') {
          modifiedStab *= 1.5; // Additional 50% boost when low HP
        }
        break;
        
      case 'water_boost_low_hp':
        // Torrent: Boost Water-type moves when HP is low
        if (isLowHp && move.type === 'water') {
          modifiedStab *= 1.5; // Additional 50% boost when low HP
        }
        break;
        
      default:
        break;
    }

    return modifiedStab;
  }
}
