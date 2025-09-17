import { Injectable } from '@nestjs/common';
import { MonsterInstance, BattleContext, StatModifiers } from '../../types';
import { MonsterService } from '../monster.service';

@Injectable()
export class AbilityEffectsService {
  constructor(private monsterService: MonsterService) {}

  // Apply battle start effects (like Intimidate) and return battle context
  initializeBattleContext(
    playerMonster: MonsterInstance, 
    opponentMonster: MonsterInstance
  ): { battleContext: BattleContext; effects: string[] } {
    const effects: string[] = [];
    const battleContext: BattleContext = {
      playerMonster,
      opponentMonster,
      playerStatModifiers: {},
      opponentStatModifiers: {}
    };

    // Check player monster's ability
    const playerAbility = this.monsterService.getAbilityData(playerMonster.ability);
    if (playerAbility?.effect === 'lower_opponent_attack') {
      // Intimidate reduces opponent's attack by 1 stage
      battleContext.opponentStatModifiers.attack = -1;
      effects.push(`${playerMonster.name}'s Intimidate lowered ${opponentMonster.name}'s Attack!`);
    }

    // Check opponent monster's ability
    const opponentAbility = this.monsterService.getAbilityData(opponentMonster.ability);
    if (opponentAbility?.effect === 'lower_opponent_attack') {
      // Intimidate reduces player's attack by 1 stage
      battleContext.playerStatModifiers.attack = -1;
      effects.push(`${opponentMonster.name}'s Intimidate lowered ${playerMonster.name}'s Attack!`);
    }

    return { battleContext, effects };
  }

  // Legacy method for compatibility - now deprecated
  applyBattleStartEffects(
    playerMonster: MonsterInstance, 
    opponentMonster: MonsterInstance
  ): string[] {
    const result = this.initializeBattleContext(playerMonster, opponentMonster);
    return result.effects;
  }

  // Apply speed-based abilities
  applySpeedAbilities(monster: MonsterInstance): number {
    const abilityData = this.monsterService.getAbilityData(monster.ability);
    if (!abilityData) return monster.stats.speed;

    let modifiedSpeed = monster.stats.speed;

    switch (abilityData.effect) {
      case 'speed_boost_water':
        // Swift Swim: Double speed in water environments (for now, just a 50% boost)
        modifiedSpeed = Math.floor(modifiedSpeed * 1.5);
        break;
        
      default:
        break;
    }

    return modifiedSpeed;
  }
}
