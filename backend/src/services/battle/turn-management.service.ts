import { Injectable } from '@nestjs/common';
import { MonsterInstance, BattleContext } from '../../types';
import { StatusEffectService } from './status-effect.service';
import { WeatherService } from './weather.service';
import { AbilityEffectsService } from './ability-effects.service';

@Injectable()
export class TurnManagementService {
  constructor(
    private statusEffectService: StatusEffectService,
    private weatherService: WeatherService,
    private abilityEffectsService: AbilityEffectsService
  ) {}

  /**
   * Process end of turn effects for both monsters
   */
  processEndOfTurn(
    playerMonster: MonsterInstance, 
    opponentMonster: MonsterInstance,
    battleContext?: BattleContext
  ): {
    playerEffects: string[];
    opponentEffects: string[];
    playerDamage: number;
    opponentDamage: number;
    updatedBattleContext?: BattleContext;
  } {
    const playerStatusResult = this.statusEffectService.applyStatusDamage(playerMonster);
    const opponentStatusResult = this.statusEffectService.applyStatusDamage(opponentMonster);

    // Process natural recovery
    const playerRecovery = this.statusEffectService.processStatusRecovery(playerMonster);
    const opponentRecovery = this.statusEffectService.processStatusRecovery(opponentMonster);

    // Process weather damage
    let playerWeatherDamage = 0;
    let opponentWeatherDamage = 0;
    const weatherEffects: string[] = [];
    let updatedBattleContext = battleContext;

    if (battleContext?.weather) {
      const playerWeatherResult = this.weatherService.applyWeatherDamage(playerMonster, battleContext.weather);
      const opponentWeatherResult = this.weatherService.applyWeatherDamage(opponentMonster, battleContext.weather);
      
      playerWeatherDamage = playerWeatherResult.damage;
      opponentWeatherDamage = opponentWeatherResult.damage;
      weatherEffects.push(...playerWeatherResult.effects, ...opponentWeatherResult.effects);

      // Apply weather damage
      if (playerWeatherDamage > 0) {
        playerMonster.currentHp = Math.max(0, playerMonster.currentHp - playerWeatherDamage);
      }
      if (opponentWeatherDamage > 0) {
        opponentMonster.currentHp = Math.max(0, opponentMonster.currentHp - opponentWeatherDamage);
      }

      // Update weather condition (reduce turns remaining)
      const updatedWeather = this.weatherService.updateWeatherCondition(battleContext.weather);
      updatedBattleContext = {
        ...battleContext,
        weather: updatedWeather
      };

      // Add weather end message if weather ended
      if (battleContext.weather && !updatedWeather) {
        weatherEffects.push(this.weatherService.getWeatherEndMessage(battleContext.weather.weather));
      }
    }

    return {
      playerEffects: [...playerStatusResult.effects, ...playerRecovery.effects, ...weatherEffects.filter(effect => 
        effect.includes(playerMonster.name) || (!effect.includes(opponentMonster.name) && !effect.includes('faded') && !effect.includes('stopped') && !effect.includes('subsided') && !effect.includes('cleared') && !effect.includes('died down'))
      )],
      opponentEffects: [...opponentStatusResult.effects, ...opponentRecovery.effects, ...weatherEffects.filter(effect => 
        effect.includes(opponentMonster.name) || (!effect.includes(playerMonster.name) && (effect.includes('faded') || effect.includes('stopped') || effect.includes('subsided') || effect.includes('cleared') || effect.includes('died down')))
      )],
      playerDamage: playerStatusResult.damage + playerWeatherDamage,
      opponentDamage: opponentStatusResult.damage + opponentWeatherDamage,
      updatedBattleContext
    };
  }

  /**
   * Determine turn order based on speed (with status effect and ability modifiers)
   */
  determineTurnOrder(
    playerMonster: MonsterInstance, 
    opponentMonster: MonsterInstance,
    battleContext?: BattleContext
  ): 'player' | 'opponent' {
    const playerModifiedStats = this.statusEffectService.getStatusModifiedStats(playerMonster);
    const opponentModifiedStats = this.statusEffectService.getStatusModifiedStats(opponentMonster);

    // Apply ability speed modifications (like Swift Swim in rain)
    const playerSpeed = this.abilityEffectsService.applySpeedAbilities(playerMonster, battleContext?.weather);
    const opponentSpeed = this.abilityEffectsService.applySpeedAbilities(opponentMonster, battleContext?.weather);

    // Use the ability-modified speeds, but also consider status effects
    const finalPlayerSpeed = Math.floor(playerSpeed * (playerModifiedStats.speed / playerMonster.stats.speed));
    const finalOpponentSpeed = Math.floor(opponentSpeed * (opponentModifiedStats.speed / opponentMonster.stats.speed));

    if (finalPlayerSpeed === finalOpponentSpeed) {
      // Tie breaker: random
      return Math.random() < 0.5 ? 'player' : 'opponent';
    }

    return finalPlayerSpeed > finalOpponentSpeed ? 'player' : 'opponent';
  }

  /**
   * Check if battle should end due to fainting
   */
  checkBattleEnd(playerMonster: MonsterInstance, opponentMonster: MonsterInstance): {
    battleEnded: boolean;
    winner?: 'player' | 'opponent';
    reason?: string;
  } {
    const playerFainted = playerMonster.currentHp <= 0;
    const opponentFainted = opponentMonster.currentHp <= 0;

    if (playerFainted && opponentFainted) {
      return {
        battleEnded: true,
        winner: undefined, // Draw
        reason: 'Both monsters fainted!'
      };
    }

    if (playerFainted) {
      return {
        battleEnded: true,
        winner: 'opponent',
        reason: `${playerMonster.name} fainted!`
      };
    }

    if (opponentFainted) {
      return {
        battleEnded: true,
        winner: 'player',
        reason: `${opponentMonster.name} fainted!`
      };
    }

    return { battleEnded: false };
  }
}
