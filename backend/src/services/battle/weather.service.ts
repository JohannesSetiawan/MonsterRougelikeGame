import { Injectable } from '@nestjs/common';
import { MonsterInstance, Weather, WeatherCondition, MonsterType, BattleContext, Move, MoveCategory } from '../../types';
import { MonsterService } from '../monster.service';

@Injectable()
export class WeatherService {
  constructor(private monsterService: MonsterService) {}

  /**
   * Generates a random weather condition for battle initialization
   * 70% chance of no weather, 30% chance of random weather
   */
  generateRandomWeather(): WeatherCondition | undefined {
    const weatherChance = Math.random();
    
    // 70% chance of no weather
    if (weatherChance < 0.0) {
      return undefined;
    }

    // 30% chance of random weather
    const weatherTypes = Object.values(Weather);
    const randomWeather = weatherTypes[Math.floor(Math.random() * weatherTypes.length)];
    
    return {
      weather: randomWeather,
      turnsRemaining: this.getWeatherDuration(randomWeather)
    };
  }

  /**
   * Gets the default duration for weather conditions
   */
  private getWeatherDuration(weather: Weather): number {
    // Most weather lasts 5 turns by default
    return 5;
  }

  /**
   * Applies weather-based move power modifiers
   */
  getWeatherMovePowerMultiplier(move: Move, weather?: WeatherCondition): number {
    if (!weather) return 1.0;

    switch (weather.weather) {
      case Weather.HARSH_SUNLIGHT:
        if (move.type === MonsterType.FIRE) return 1.5; // 50% boost
        if (move.type === MonsterType.WATER) return 0.5; // 50% reduction
        break;
      
      case Weather.RAIN:
        if (move.type === MonsterType.WATER) return 1.5; // 50% boost
        if (move.type === MonsterType.FIRE) return 0.5; // 50% reduction
        break;
    }

    return 1.0;
  }

  /**
   * Applies weather-based accuracy modifiers
   */
  getWeatherAccuracyMultiplier(weather?: WeatherCondition): number {
    if (!weather) return 1.0;

    switch (weather.weather) {
      case Weather.FOG:
        return 0.8; // 20% accuracy reduction
    }

    return 1.0;
  }

  /**
   * Gets weather-based type effectiveness modifications
   */
  getWeatherTypeEffectivenessMultiplier(
    moveType: MonsterType, 
    defenderType: MonsterType, 
    baseEffectiveness: number,
    weather?: WeatherCondition
  ): number {
    if (!weather) return baseEffectiveness;

    switch (weather.weather) {
      case Weather.STRONG_WINDS:
        // Electric, Ice, and Rock moves deal neutral damage to Flying types
        if (defenderType === MonsterType.FLYING && 
            (moveType === MonsterType.ELECTRIC || 
             moveType === MonsterType.ICE || 
             moveType === MonsterType.ROCK) &&
            baseEffectiveness > 1) {
          return 1.0; // Neutral damage instead of super effective
        }
        break;
    }

    return baseEffectiveness;
  }

  /**
   * Applies weather-based stat boosts at battle start
   */
  applyWeatherStatBoosts(monster: MonsterInstance, weather?: WeatherCondition): { attack?: number; defense?: number; specialAttack?: number; specialDefense?: number; speed?: number } {
    if (!weather) return {};

    const monsterData = this.monsterService.getMonsterData(monster.monsterId);
    const boosts: { attack?: number; defense?: number; specialAttack?: number; specialDefense?: number; speed?: number } = {};

    switch (weather.weather) {
      case Weather.SANDSTORM:
        // Rock-type monsters get +1 Sp. Defense stage
        if (monsterData.type.includes(MonsterType.ROCK)) {
          boosts.specialDefense = 1;
        }
        break;
      
      case Weather.HAIL:
        // Ice-type monsters get +1 Defense stage
        if (monsterData.type.includes(MonsterType.ICE)) {
          boosts.defense = 1;
        }
        break;
    }

    return boosts;
  }

  /**
   * Applies end-of-turn weather damage
   */
  applyWeatherDamage(monster: MonsterInstance, weather?: WeatherCondition): { damage: number; effects: string[] } {
    const result = { damage: 0, effects: [] as string[] };
    
    if (!weather) return result;

    const monsterData = this.monsterService.getMonsterData(monster.monsterId);

    switch (weather.weather) {
      case Weather.SANDSTORM:
        // Damage all non-Rock, non-Ground, non-Steel types
        if (!monsterData.type.includes(MonsterType.ROCK) &&
            !monsterData.type.includes(MonsterType.GROUND) &&
            !monsterData.type.includes(MonsterType.STEEL)) {
          result.damage = Math.max(1, Math.floor(monster.maxHp / 16));
          result.effects.push(`${monster.name} is buffeted by the sandstorm!`);
        }
        break;
      
      case Weather.HAIL:
        // Damage all non-Ice types
        if (!monsterData.type.includes(MonsterType.ICE)) {
          result.damage = Math.max(1, Math.floor(monster.maxHp / 16));
          result.effects.push(`${monster.name} is pelted by hail!`);
        }
        break;
    }

    return result;
  }

  /**
   * Checks if a status effect should be prevented by weather
   */
  shouldPreventStatusEffect(statusEffect: string, weather?: WeatherCondition): boolean {
    if (!weather) return false;

    switch (weather.weather) {
      case Weather.HARSH_SUNLIGHT:
        // Prevent freezing during harsh sunlight
        return statusEffect === 'freeze' || statusEffect === 'frostbite';
    }

    return false;
  }

  /**
   * Updates weather condition (reduces turns remaining)
   */
  updateWeatherCondition(weather?: WeatherCondition): WeatherCondition | undefined {
    if (!weather || !weather.turnsRemaining) return weather;

    const newTurnsRemaining = weather.turnsRemaining - 1;
    
    if (newTurnsRemaining <= 0) {
      return undefined; // Weather ends
    }

    return {
      ...weather,
      turnsRemaining: newTurnsRemaining
    };
  }

  /**
   * Gets weather description for battle messages
   */
  getWeatherDescription(weather: Weather): string {
    switch (weather) {
      case Weather.HARSH_SUNLIGHT:
        return 'The sunlight is harsh!';
      case Weather.RAIN:
        return 'It\'s raining!';
      case Weather.SANDSTORM:
        return 'A sandstorm is raging!';
      case Weather.HAIL:
        return 'It\'s hailing!';
      case Weather.FOG:
        return 'A thick fog has rolled in!';
      case Weather.STRONG_WINDS:
        return 'Strong winds are blowing!';
      default:
        return '';
    }
  }

  /**
   * Gets weather end message
   */
  getWeatherEndMessage(weather: Weather): string {
    switch (weather) {
      case Weather.HARSH_SUNLIGHT:
        return 'The harsh sunlight faded.';
      case Weather.RAIN:
        return 'The rain stopped.';
      case Weather.SANDSTORM:
        return 'The sandstorm subsided.';
      case Weather.HAIL:
        return 'The hail stopped.';
      case Weather.FOG:
        return 'The fog cleared.';
      case Weather.STRONG_WINDS:
        return 'The strong winds died down.';
      default:
        return '';
    }
  }

  /**
   * Gets weather effect description for display
   */
  getWeatherEffectDescription(weather: Weather): string {
    switch (weather) {
      case Weather.HARSH_SUNLIGHT:
        return 'Fire moves boosted, Water moves weakened';
      case Weather.RAIN:
        return 'Water moves boosted, Fire moves weakened';
      case Weather.SANDSTORM:
        return 'Rock-types get Sp.Def boost, others take damage';
      case Weather.HAIL:
        return 'Ice-types get Defense boost, others take damage';
      case Weather.FOG:
        return 'All moves have reduced accuracy';
      case Weather.STRONG_WINDS:
        return 'Flying-types resist Electric, Ice, and Rock';
      default:
        return '';
    }
  }
}