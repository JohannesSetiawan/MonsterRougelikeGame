import { Injectable } from '@nestjs/common';
import { MonsterInstance, BattleContext } from '../../types';
import { StatusEffectService } from './status-effect.service';
import { WeatherService } from './weather.service';
import { AbilityEffectsService } from './ability-effects.service';
import { TwoTurnMoveService } from './two-turn-move.service';
import { MultiTurnMoveService } from './multi-turn-move.service';

@Injectable()
export class TurnManagementService {
  constructor(
    private statusEffectService: StatusEffectService,
    private weatherService: WeatherService,
    private abilityEffectsService: AbilityEffectsService,
    private twoTurnMoveService: TwoTurnMoveService,
    private multiTurnMoveService: MultiTurnMoveService
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

    // Process two-turn move end of turn effects
    const playerTwoTurnEffects = this.twoTurnMoveService.processEndOfTurn(playerMonster);
    const opponentTwoTurnEffects = this.twoTurnMoveService.processEndOfTurn(opponentMonster);

    // Process multi-turn move end of turn effects
    const playerLockingEffects = this.multiTurnMoveService.processLockingMoveEndOfTurn(playerMonster);
    const opponentLockingEffects = this.multiTurnMoveService.processLockingMoveEndOfTurn(opponentMonster);

    // Process trapping damage
    const playerTrappingResult = this.multiTurnMoveService.processTrappingDamage(playerMonster);
    const opponentTrappingResult = this.multiTurnMoveService.processTrappingDamage(opponentMonster);

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
      playerEffects: [...playerStatusResult.effects, ...playerRecovery.effects, ...playerTwoTurnEffects, ...playerLockingEffects, ...playerTrappingResult.effects, ...weatherEffects.filter(effect => 
        effect.includes(playerMonster.name) || (!effect.includes(opponentMonster.name) && !effect.includes('faded') && !effect.includes('stopped') && !effect.includes('subsided') && !effect.includes('cleared') && !effect.includes('died down'))
      )],
      opponentEffects: [...opponentStatusResult.effects, ...opponentRecovery.effects, ...opponentTwoTurnEffects, ...opponentLockingEffects, ...opponentTrappingResult.effects, ...weatherEffects.filter(effect => 
        effect.includes(opponentMonster.name) || (!effect.includes(playerMonster.name) && (effect.includes('faded') || effect.includes('stopped') || effect.includes('subsided') || effect.includes('cleared') || effect.includes('died down')))
      )],
      playerDamage: playerStatusResult.damage + playerWeatherDamage + playerTrappingResult.damage,
      opponentDamage: opponentStatusResult.damage + opponentWeatherDamage + opponentTrappingResult.damage,
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

  /**
   * Check if a monster is committed to a two-turn move and must use a specific move
   */
  getForcedMove(monster: MonsterInstance): string | null {
    // Check for two-turn move forced moves first
    const twoTurnForced = this.twoTurnMoveService.getForcedMove(monster);
    if (twoTurnForced) {
      return twoTurnForced;
    }

    // Check for multi-turn move forced moves
    return this.multiTurnMoveService.getForcedMove(monster);
  }

  /**
   * Check if a monster must recharge this turn
   */
  mustRecharge(monster: MonsterInstance): boolean {
    return this.twoTurnMoveService.mustRecharge(monster);
  }

  /**
   * Get the status message for a monster's two-turn move state
   */
  getTwoTurnMoveStatusMessage(monster: MonsterInstance): string | null {
    return this.twoTurnMoveService.getStatusMessage(monster);
  }

  /**
   * Get the status message for a monster's multi-turn move state
   */
  getMultiTurnMoveStatusMessage(monster: MonsterInstance): string | null {
    return this.multiTurnMoveService.getStatusMessage(monster);
  }

  /**
   * Get all status messages for a monster's move states
   */
  getAllMoveStatusMessages(monster: MonsterInstance): string[] {
    const messages: string[] = [];
    
    const twoTurnMessage = this.getTwoTurnMoveStatusMessage(monster);
    if (twoTurnMessage) {
      messages.push(twoTurnMessage);
    }

    const multiTurnMessage = this.getMultiTurnMoveStatusMessage(monster);
    if (multiTurnMessage) {
      messages.push(multiTurnMessage);
    }

    return messages;
  }

  /**
   * Check if a monster is in a semi-invulnerable state
   */
  isSemiInvulnerable(monster: MonsterInstance): boolean {
    return this.twoTurnMoveService.isSemiInvulnerable(monster);
  }
}
